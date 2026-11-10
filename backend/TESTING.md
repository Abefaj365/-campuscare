# How to test this backend from scratch (learn by doing)

This is exactly how the backend was tested before it was sent for
review. Follow it in order on your own machine — every step has an
expected result, so you can tell immediately if something is wrong.

You need: Node.js, and MySQL. On Windows, XAMPP's MySQL is fine
(see README.md, "Using XAMPP"). You do **not** need Apache.

## Step 0 — Start from a clean copy

```bash
git clone https://github.com/Abefaj365/-campuscare.git campuscare
cd campuscare/backend
```

If you already have the project, use a fresh folder instead of
re-using an old one — that is what "from scratch" means. An old
`node_modules` or `.env` can hide a setup bug.

## Step 1 — Install dependencies

```bash
npm ci
```

Expected: `added 97 packages` (the exact number may change as
dependencies update) and **no** `multer` — this project has no
image upload, by design. If `npm ci` fails with a lockfile error,
your `package.json` and `package-lock.json` are out of sync; run
`npm install` once to regenerate the lockfile, then `npm ci` again.

## Step 2 — Create the database

In XAMPP: start **MySQL** in XAMPP Control Panel, open
`http://localhost/phpmyadmin`, create a database called
`campuscare`, select it, and import `schema.sql`.

From the command line (MySQL / MariaDB):

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS campuscare;"
mysql -u root campuscare < schema.sql
```

Expected: the database now has 4 tables — `users`,
`complaints`, `complaint_comments`, `ratings`. Check with:

```bash
mysql -u root campuscare -e "SHOW TABLES;"
```

## Step 3 — Configure `.env`

```bash
cp .env.example .env
```

Edit `.env` (XAMPP defaults shown):

```ini
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=campuscare
JWT_SECRET=put-a-long-random-secret-here
```

`DB_PASS` stays blank if your MySQL `root` user has no password.
`JWT_SECRET` must not be blank — the server refuses to start
without it, on purpose, so a missing `.env` is obvious instead
of failing silently later.

## Step 4 — Create an admin (public registration cannot do this)

```bash
node scripts/create-admin.js "Admin Name" admin@example.com "a-strong-password"
```

Expected: `Admin account created for admin@example.com.`
Try it twice with the same email — the second time must fail
with `That email is already registered.` Public registration
always creates a **student**, even if you send `"role": "admin"`.

## Step 5 — Start the server

```bash
npm start
```

Expected: `Server running on port 5000`.

Now check it in a browser (this is the "live" view):

- `http://localhost:5000/` → `CampusCare backend is running`
- `http://localhost:5000/test-db` → `{"success": true, "result": 2}`

If `/test-db` fails, MySQL is usually not running yet, or the
database name in `.env` does not match the one you created.

## Step 6 — Test every feature (with curl)

Keep the server running and use a second terminal. Replace
`TOKEN` with the token login returns. In Postman the same
requests work — put the token in
`Authorization: Bearer TOKEN`.

### Registration

```bash
# Must succeed (201), and must be a student even with role=admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Student One","email":"s1@test.com","password":"password123","student_id":"S1001","role":"admin"}'

# Must fail (400) — missing student_id, bad email, short password,
# duplicate email, duplicate student_id. Try each one and check
# you get 400, not 500.
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s1@test.com","password":"password123"}'
# Expected: success, a token, and user.role = "student"

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s1@test.com","password":"wrongpassword"}'
# Expected: 401 Invalid email or password
```

Save the token: `TOKEN=<paste the token here>`. Do the same
for the admin account to get `ADMIN_TOKEN`.

### Complaints

```bash
# Create — must be 201. Bad priority ("urgent") must be 400,
# missing description must be 400.
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"category":"WiFi","location":"Lab 1","description":"No internet","priority":"high"}'

# My complaints — must list only your own
curl http://localhost:5000/api/complaints/my -H "Authorization: Bearer TOKEN"

# All complaints — student must get 403, admin must get the list
curl http://localhost:5000/api/complaints -H "Authorization: Bearer TOKEN"
curl http://localhost:5000/api/complaints -H "Authorization: Bearer ADMIN_TOKEN"
```

### Status updates (admin only)

```bash
# Student -> 403, invalid status -> 400, unknown id -> 404
curl -X PATCH http://localhost:5000/api/complaints/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'

curl -X PATCH http://localhost:5000/api/complaints/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"resolved"}'
```

### Comments (owner or admin only)

```bash
curl -X POST http://localhost:5000/api/complaints/1/comments \
  -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"comment":"We are looking into it"}'
# Expected: 201. Unknown complaint -> 404. Another student -> 403.

curl http://localhost:5000/api/complaints/1/comments \
  -H "Authorization: Bearer TOKEN"
```

### Ratings (owner, resolved complaints only)

```bash
# Before resolved -> 400. "abc", 0, 6, 4.5 -> all 400.
# After resolved -> 201 for 5, then a second rating -> 409.
curl -X POST http://localhost:5000/api/complaints/1/rating \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"rating":5,"feedback":"Great fix"}'

curl http://localhost:5000/api/complaints/1/rating \
  -H "Authorization: Bearer TOKEN"
# Expected: the rating you just gave, with rating 5
```

### Admin stats

```bash
curl http://localhost:5000/api/complaints/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: total 1, byStatus resolved 1 (after the steps above)
```

### Password reset

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"s1@test.com"}'
# Expected: a generic success message and NO resetToken in the
# response. That is deliberate — returning it would let anyone
# reset any account. In production the token is emailed (SMTP in
# .env). In development only, the token is printed to the server
# log — copy it from there, never from an API response.

curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<token from email or dev log>","newPassword":"newpassword123"}'
# Expected: success. Log in with the new password to confirm.
# Reusing the same token again must give 400.
# An expired token (older than 1 hour) must give 400.
```

## Step 7 — What "all working" looks like

- No 500 errors in the happy path, and every error above gives
  the status code shown (400 / 401 / 403 / 404 / 409), not a
  crash and not a raw database error message.
- A student can never become an admin, see another student's
  complaints, or rate a complaint that is not theirs or not
  resolved.
- The server stops cleanly with Ctrl+C. The database is yours
  to reset: drop `campuscare`, re-import `schema.sql`, and you
  are back to a clean slate.

## Troubleshooting

| Symptom | Most likely cause |
| --- | --- |
| Server exits: "Missing required environment variables" | `.env` is missing or `JWT_SECRET` is blank |
| `/test-db` fails | MySQL not started in XAMPP, or wrong `DB_NAME` / `DB_USER` / `DB_PASS` |
| `npm ci` lockfile error | `package.json` changed without `package-lock.json` — run `npm install` once |
| Port already in use | Another server is on port 5000 — stop it, or set `PORT=5001` in `.env` |
| 401 on every request | Missing or expired `Authorization: Bearer TOKEN` header — log in again |
