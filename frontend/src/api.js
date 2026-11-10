// CampusCare API client — one place for every backend call.
// Backend base URL: http://localhost:5000 by default.
// To point at a deployed backend, create a .env file with:
//   VITE_API_URL=https://your-backend.onrender.com

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export const apiBase = API_BASE

async function request(path, method = 'GET', body, token) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`)
  return data
}

export const api = {
  // Connection check
  testDb: () => request('/test-db'),

  // Auth — POST /api/auth/*
  register: (payload) => request('/api/auth/register', 'POST', payload),
  login: (payload) => request('/api/auth/login', 'POST', payload),
  forgotPassword: (email) => request('/api/auth/forgot-password', 'POST', { email }),
  resetPassword: (token, newPassword) =>
    request('/api/auth/reset-password', 'POST', { token, newPassword }),

  // Complaints
  createComplaint: (payload, token) => request('/api/complaints', 'POST', payload, token),
  myComplaints: (token) => request('/api/complaints/my', 'GET', null, token),
  allComplaints: (token, status) =>
    request('/api/complaints' + (status ? `?status=${status}` : ''), 'GET', null, token),
  updateStatus: (id, status, token) =>
    request(`/api/complaints/${id}/status`, 'PATCH', { status }, token),
  stats: (token) => request('/api/complaints/stats', 'GET', null, token),

  // Comments
  getComments: (id, token) => request(`/api/complaints/${id}/comments`, 'GET', null, token),
  addComment: (id, comment, token) =>
    request(`/api/complaints/${id}/comments`, 'POST', { comment }, token),

  // Ratings
  getRating: (id, token) => request(`/api/complaints/${id}/rating`, 'GET', null, token),
  addRating: (id, rating, feedback, token) =>
    request(`/api/complaints/${id}/rating`, 'POST', { rating, feedback }, token),
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
