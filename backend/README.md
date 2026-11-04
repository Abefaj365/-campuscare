# CampusCare backend

Node.js + Express + MySQL backend for CampusCare: student complaints,
comments, ratings, and admin status management.

## Setup (from scratch)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET
```

Create the database and tables:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS campuscare;"
mysql -u root -p campuscare < schema.sql
```

Start it:

```bash
npm start
# Server running on port 5000 (or PORT from .env)
```

Check it: `GET http://localhost:5000/` and
`GET http://localhost:5000/test-db` (should return `{"success": true, "result": 2}`).

The server refuses to start if `DB_HOST`, `DB_USER`, `DB_NAME`, or
`JWT_SECRET` is missing, instead of printing "running" and failing
every request later. `DB_PASS` may be blank for a local MySQL user
with no password.

## Admin accounts

Public registration only creates **student** accounts. It cannot
create admins — that was previously possible by sending
`"role": "admin"` in the register request, which was a critical
security bug.

Create an admin from the command line:

```bash
node scripts/create-admin.js "Admin Name" admin@example.com "a-strong-password"
```

## Password reset

`POST /api/auth/forgot-password` never returns the reset token in
its response. The token is emailed to the account holder (see
`.env.example` for `SMTP_*`). Without SMTP configured, no email is
sent; in development only, the token is printed to the server log
so you can test the flow locally. Configure SMTP before relying on
password reset in production.

## API

All routes below are under `/api`. Authenticated routes need
`Authorization: Bearer <token>` from login.

| Method | Route | Who | Notes |
| --- | --- | --- | --- |
| POST | /auth/register | Public | Always creates a student; `name`, `email`, `password` (min 8 chars), `student_id` required |
| POST | /auth/login | Public | Returns JWT (1 day) + user |
| POST | /auth/forgot-password | Public | Generic response either way; token emailed, never returned |
| POST | /auth/reset-password | Public | `{ token, newPassword }`, token valid 1 hour |
| POST | /complaints | Any logged-in user | `category`, `location`, `description` required; `priority` low/medium/high |
| GET | /complaints/my | Any logged-in user | Own complaints only |
| GET | /complaints | Admin | Optional `?status=pending\|in_progress\|resolved` |
| GET | /complaints/stats | Admin | Totals by status and category |
| PATCH | /complaints/:id/status | Admin | `status` pending/in_progress/resolved; 404 for unknown ID |
| POST | /complaints/:id/comments | Owner or admin | 404 for unknown complaint |
| GET | /complaints/:id/comments | Owner or admin | |
| POST | /complaints/:id/rating | Owner, resolved only | Whole number 1–5, one rating per complaint |
| GET | /complaints/:id/rating | Owner or admin | |

There is intentionally no `GET /complaints/:id` single-complaint
endpoint yet, and no file/image upload — `multer` is listed as a
dependency but unused. Add those only if the frontend needs them.

## Environment variables

See `.env.example`. Required: `DB_HOST`, `DB_USER`, `DB_NAME`,
`JWT_SECRET`. Optional: `PORT` (default 5000), `DB_PORT` (default
3306), `DB_PASS`, `CORS_ORIGIN`, `FRONTEND_URL`, `SMTP_*`.
