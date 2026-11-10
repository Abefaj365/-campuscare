# CampusCare Frontend — React + Vite

Single-page React frontend for the CampusCare backend (Node.js + Express + MySQL).
Covers **all 13 backend API routes**, all in English.

## Project structure

```
CampusCare-Frontend-React/
├── package.json          # react, react-dom, vite
├── vite.config.js        # Vite + React plugin
├── index.html            # <div id="root">
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Shell: header, login state, role-based views
    ├── App.css           # All styles
    ├── api.js            # One API client for every backend call
    └── components/
        ├── Auth.jsx              # Login / Register / Forgot / Reset
        ├── ComplaintCard.jsx     # Complaint + comments + rating + status
        ├── StudentDashboard.jsx  # New complaint + My Complaints
        └── AdminDashboard.jsx    # Stats + All Complaints + status filter
```

## Run it (backend first!)

```bash
# 1. Backend (in the main repo, backend/ folder)
cd backend
npm install
npm start          # Server running on port 5000

# 2. Frontend (this folder, in a new terminal)
cd CampusCare-Frontend-React
npm install
npm run dev        # open the http://localhost:5173 link it prints
```

## Production build

```bash
npm run build      # output goes to dist/
npm run preview    # serve the production build locally
```

## Backend address

Default: `http://localhost:5000`. To point at a deployed backend,
create a `.env` file in this folder with:

```
VITE_API_URL=https://your-backend.onrender.com
```

Then restart `npm run dev`.

## What it covers (backend route → UI)

| Backend route | UI |
|---|---|
| POST /api/auth/register | Register tab |
| POST /api/auth/login | Login tab |
| POST /api/auth/forgot-password | Forgot Password tab |
| POST /api/auth/reset-password | Reset Password tab |
| POST /api/complaints | New Complaint form |
| GET /api/complaints/my | My Complaints (student) |
| GET /api/complaints | All Complaints (admin, with status filter) |
| GET /api/complaints/stats | Admin Stats |
| PATCH /api/complaints/:id/status | Status dropdown (admin) |
| GET/POST /api/complaints/:id/comments | Comments on each complaint |
| GET/POST /api/complaints/:id/rating | Rating (1–5, once, resolved only) |

## Notes

- A new account is always a **student**. Admins are created only with
  `node scripts/create-admin.js` in the backend folder.
- JWT token is stored in `localStorage`, so refresh keeps you logged in.
- No image upload, by design — same as the backend.
