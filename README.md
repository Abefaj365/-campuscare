# CampusCare

CampusCare is a web application where students report campus problems
— for example WiFi, Transportation, Electricity or Computer issues —
and administrators track them and fix them.

Students register, log in, submit a complaint, follow its status,
comment on it, and rate it once it is resolved. Admins see all
complaints, change their status from pending to in progress to
resolved, reply in comments, and see totals by status and category.

It was built as the Software Development Project - II (SDP - II) at
BGC Trust University Bangladesh, Department of Computer Science &
Engineering.

## What it does

| Who | What they can do |
| --- | --- |
| Student | Register, log in, submit a complaint, see only their own complaints, comment on their own complaints, rate a resolved complaint once (1–5) |
| Admin | See all complaints, change a complaint's status, comment on any complaint, see stats by status and category |
| Anyone | Register as a student, log in, ask for a password reset |

## Tech stack

**Backend**

- Node.js + Express 5
- MySQL (via `mysql2`)
- JSON Web Tokens (JWT) for login — tokens last 1 day
- `bcryptjs` for password hashing

**Frontend**

- React 18 + Vite
- Plain CSS, in the university's green theme (`#0b7a3e`) with the
  BGC Trust University Bangladesh logo in the header
- Talks to the backend over REST/JSON at `http://localhost:5000`

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
├── frontend/
│   ├── public/logo.jpg    # BGC Trust University Bangladesh logo
│   ├── src/
│   │   ├── App.jsx        # App shell, header, login state
│   │   ├── api.js         # One client for all 13 API routes
│   │   ├── App.css        # Green theme
│   │   └── components/
│   │       ├── Auth.jsx            # Login / register / forgot / reset
│   │       ├── StudentDashboard.jsx
│   │       ├── AdminDashboard.jsx  # Stats + all complaints
│   │       └── ComplaintCard.jsx   # Comments, rating, status control
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
└── README.md              # This file
```

## Setup from scratch

You need Node.js and MySQL. On Windows, XAMPP's MySQL works — you
only need its **MySQL** module, not Apache, because this project is
Node.js + React, not PHP. On Mac, MySQL can be installed with
Homebrew (`brew install mysql`) or XAMPP.

```bash
git clone https://github.com/Abefaj365/-campuscare.git campuscare
cd campuscare
```

(The repo folder is called `-campuscare`, with a leading hyphen, so
cloning it into a folder called `campuscare` avoids `cd -campuscare`
failing in a terminal.)

### 1. Database

Create a database called `campuscare` and import `backend/schema.sql`
(4 tables: `users`, `complaints`, `complaint_comments`, `ratings`).
In XAMPP, open phpMyAdmin at `http://localhost/phpmyadmin`, create
the database, select it, and import the file. From the command line:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS campuscare;"
mysql -u root campuscare < backend/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

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

Start the server (keep this terminal open):

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

### 3. Admin account

Public registration **only creates student accounts**. It cannot
create admins — sending `"role": "admin"` in a register request is
ignored. That was a security bug, now fixed.

Make an admin from the command line, in a second terminal:

```bash
cd backend
node scripts/create-admin.js "Admin Name" admin@example.com "a-strong-password"
```

Admin accounts live in your local database, not in the code — on a
fresh setup, create the admin again with the same script.

### 4. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
# Local: http://localhost:5173/
```

Open `http://localhost:5173/` in the browser. You need both servers
running at the same time: the backend on `:5000` and the frontend on
`:5173`. (Do not use Live Server / Go Live for the React app — it
only works with `npm run dev`.)

> The frontend calls `http://localhost:5000`, so the demo only works
> in the browser on the machine where the backend is running.

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

A from-scratch end-to-end suite of 34 checks (all 13 routes plus
security checks) passes against the backend.

## Decisions, not missing features

- **No image upload.** There is no file/image upload in this
  project by design, so `multer` was removed from the
  dependencies. Do not add it back without changing that decision.
- **No single-complaint endpoint yet.** There is intentionally
  no `GET /complaints/:id` endpoint yet.
- **No notifications, no search.** The system has no email/push
  notifications and no free-text search; the admin can filter
  complaints by status. Both are future work, not oversights.

## Team

Software Development Project - II (SDP - II), Department of
Computer Science & Engineering, BGC Trust University Bangladesh.

- Abdur Rahman Ibne Efaj (240242052)
- Tawsif Ahmed (240242095)
- Triparna Chowdhury (2302400532)
