import { useState } from 'react'
import Auth from './components/Auth.jsx'
import StudentDashboard from './components/StudentDashboard.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'

// CampusCare frontend.
// Talks to the Node/Express backend at http://localhost:5000
// (or VITE_API_URL when deployed). Backend must run first: `npm start` in backend/.
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('cc_token') || '')
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_user') || 'null')
    } catch {
      return null
    }
  })
  const [message, setMessage] = useState(null) // { text, ok }

  function showMessage(text, ok) {
    setMessage({ text, ok })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setMessage(null), 7000)
  }

  function handleLogin(newToken, newUser) {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('cc_token', newToken)
    localStorage.setItem('cc_user', JSON.stringify(newUser))
    showMessage(`Login successful! Welcome, ${newUser.name} 👋`, true)
  }

  function handleLogout() {
    setToken('')
    setUser(null)
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    showMessage('You have been logged out.', true)
  }

  const loggedIn = Boolean(token && user)
  const isAdmin = loggedIn && user.role === 'admin'

  return (
    <>
      <header>
        <div className="wrap" style={{ padding: 0 }}>
          <div className="topbar">
            <div className="brand-row">
              <img src="/logo.jpg" alt="BGC Trust University Bangladesh logo" className="logo" />
              <div>
                <h1>CampusCare</h1>
                <p>BGC Trust University Bangladesh</p>
                <p className="tagline">Student complaints, comments, ratings &amp; admin management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="wrap">
        {message && <div className={`msg ${message.ok ? 'ok' : 'err'}`}>{message.text}</div>}

        {!loggedIn && <Auth onLogin={handleLogin} />}

        {loggedIn && (
          <div className="card">
            <div className="topbar">
              <div className="user-row">
                <div className="avatar">{(user.name || '?').trim().charAt(0).toUpperCase()}</div>
                <div>
                  <h2 style={{ margin: 0 }}>{user.name}</h2>
                  <p className="muted">
                    <span className="pill info">{isAdmin ? '👑 Admin' : '🎓 Student'}</span>
                    {' '}Student ID: <b>{user.student_id || '-'}</b>
                  </p>
                </div>
              </div>
              <button className="danger" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        )}

        {loggedIn && !isAdmin && (
          <StudentDashboard user={user} token={token} onError={(m) => showMessage(m, false)} />
        )}

        {loggedIn && isAdmin && (
          <AdminDashboard user={user} token={token} onError={(m) => showMessage(m, false)} />
        )}
      </div>
    </>
  )
}
