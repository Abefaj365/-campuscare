# CampusCare

CampusCare is a backend for students to report campus problems, and for
admins to track and fix them.

Students register, log in, submit a complaint (for example WiFi, Plumbing
or Electricity), comment on it, and rate it once it is resolved. Admins
see all complaints, change their status from pending to in progress to
resolved, reply in comments, and see totals by status and category.

There is no frontend in this repository yet — it is a backend only.

## Tech stack

- Node.js + Express
- MySQL (via `mysql2`)
- JSON Web Tokens (JWT) for login
- `bcryptjs` for password hashing

## What it does

| Who | What they can do |
| --- | --- |
| Student | Register, log in, submit a complaint, see only their own complaints, comment on their own complaints, rate a resolved complaint once |
| Admin | See all complaints, change a complaint's status, comment on any complaint, see stats by status and category |
| Anyone | Register as a student, log in, ask for a password reset |

## Project layout

```
.
├── backend/
│   ├── server.js          # Starts the server, mounts the routes
│   ├── config/db.js       # MySQL connection pool
│   ├── controllers/       # Auth, complaints, comments, ratings
│   ├── middleware/        # JWT check, admin-only check
│   ├── routes/            # /api/auth, /api/complaints
│   ├── scripts/
│   │   └── create-admin.js  # The only way to make an admin account
│   ├── utils/mailer.js    # Password-reset emails (SMTP)
│   ├── schema.sql         # Database tables (users, complaints,
│   │                      # complaint_comments, ratings)
│   ├── .env.example       # Settings you need to copy to .env
│   ├── README.md          # Full backend guide, API table, testing
│   └── TESTING.md         # Step-by-step test guide
└── README.md              # This file
```

## Setup from scratch

You need Node.js and MySQL. On Windows, XAMPP's MySQL works — you
only need its **MySQL** module, not Apache, because this backend is
Node.js, not PHP.

```bash
git clone https://github.com/Abefaj365/-campuscare.git campuscare
cd campuscare/backend
npm install
cp .env.example .env
```

(The repo folder is called `-campuscare`, with a leading hyphen, so
cloning it into a folder called `campuscare` avoids `cd -campuscare`
failing in a terminal.)

Edit `backend/.env` (XAMPP defaults shown):

```ini
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=campuscare
JWT_SECRET=put-a-long-random-secret-here
```

Create the database and its tables. In XAMPP, open phpMyAdmin at
`http://localhost/phpmyadmin`, create a database called `campuscare`,
select it, and import `backend/schema.sql`. From the command line:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS campuscare;"
mysql -u root campuscare < schema.sql
```

Start the server:

```bash
npm start
# Server running on port 5000
```

Check it in a browser:

- `http://localhost:5000/` — "CampusCare backend is running"
- `http://localhost:5000/test-db` — should return
  `{"success": true, "result": 2}`

The server refuses to start if `DB_HOST`, `DB_USER`, `DB_NAME` or
`JWT_SECRET` is missing, so a missing `.env` is obvious instead of
failing silently later.

## Admin accounts

Public registration **only creates student accounts**. It cannot
create admins — sending `"role": "admin"` in a register request is
ignored. That was a security bug, now fixed.

Make an admin from the command line, while the server is stopped
or in a second terminal:

```bash
node scripts/create-admin.js "Admin Name" admin@example.com "a-strong-password"
```

## Password reset

`POST /api/auth/forgot-password` never returns the reset token in
its response. The token is emailed to the account holder (see
`SMTP_*` in `backend/.env.example`). Without SMTP configured, no
email is sent; in development only, the token is printed to the
server log so you can test the flow locally. A token is valid for
1 hour and can only be used once. Configure SMTP before relying on
password reset in production.

## API at a glance

All routes are under `/api`. Logged-in routes need
`Authorization: Bearer <token>` from login. See
`backend/README.md` for the full table.

| Method | Route | Who |
| --- | --- | --- |
| POST | /auth/register | Public — always a student |
| POST | /auth/login | Public — returns a JWT (1 day) |
| POST | /auth/forgot-password | Public |
| POST | /auth/reset-password | Public |
| POST | /complaints | Any logged-in user |
| GET | /complaints/my | Any logged-in user — own only |
| GET | /complaints | Admin |
| GET | /complaints/stats | Admin |
| PATCH | /complaints/:id/status | Admin |
| POST | /complaints/:id/comments | Owner or admin |
| GET | /complaints/:id/comments | Owner or admin |
| POST | /complaints/:id/rating | Owner, resolved only, 1–5, once |
| GET | /complaints/:id/rating | Owner or admin |

## Testing

See `backend/TESTING.md` for a step-by-step guide, with the
expected result for every request. It covers registration,
login, complaints, comments, ratings, status updates, admin
stats, and password reset — including the cases that should
fail (400, 401, 403, 404, 409).

## Decisions, not missing features

- **No image upload.** There is no file/image upload in this
  project by design, so `multer` was removed from the
  dependencies. Do not add it back without changing that decision.
- **No single-complaint endpoint yet.** There is intentionally
  no `GET /complaints/:id` endpoint yet.
- **No frontend yet.** This repository is the backend only.
