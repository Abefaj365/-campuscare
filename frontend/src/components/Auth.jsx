import { useState } from 'react'
import { api, isEmail } from '../api.js'

// Login / Register / Forgot Password / Reset Password tabs.
// A new account is always a student — there is no way to register as admin.
export default function Auth({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regStudentId, setRegStudentId] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')

  function fail(message) {
    setError(message)
    setInfo('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!isEmail(loginEmail)) return fail('Please enter a valid email.')
    if (!loginPassword) return fail('Please enter your password.')
    setBusy(true)
    setError('')
    try {
      const data = await api.login({ email: loginEmail, password: loginPassword })
      onLogin(data.token, data.user)
    } catch (err) {
      fail(err.message)
    }
    setBusy(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword || !regStudentId) {
      return fail('Please fill in all fields.')
    }
    if (!isEmail(regEmail)) return fail('Please enter a valid email.')
    if (regPassword.length < 8) return fail('Password must be at least 8 characters.')
    setBusy(true)
    setError('')
    try {
      await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        student_id: regStudentId,
      })
      setInfo('Account created! Now please log in.')
      setTab('login')
      setLoginEmail(regEmail)
      setLoginPassword('')
    } catch (err) {
      fail(err.message)
    }
    setBusy(false)
  }

  async function handleForgot(e) {
    e.preventDefault()
    if (!isEmail(forgotEmail)) return fail('Please enter a valid email.')
    setBusy(true)
    setError('')
    try {
      const data = await api.forgotPassword(forgotEmail)
      setInfo(data.message)
    } catch (err) {
      fail(err.message)
    }
    setBusy(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!resetToken || !resetPassword) {
      return fail('Please enter the token and a new password.')
    }
    if (resetPassword.length < 8) {
      return fail('New password must be at least 8 characters.')
    }
    setBusy(true)
    setError('')
    try {
      await api.resetPassword(resetToken.trim(), resetPassword)
      setInfo('Password reset successfully! Now please log in with your new password.')
      setResetToken('')
      setResetPassword('')
      setTab('login')
    } catch (err) {
      fail(err.message)
    }
    setBusy(false)
  }

  const tabs = [
    ['login', 'Login'],
    ['register', 'Register'],
    ['forgot', 'Forgot Password'],
    ['reset', 'Reset Password'],
  ]

  return (
    <div className="card">
      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? 'active' : 'secondary'}
            onClick={() => { setTab(key); setError(''); setInfo('') }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="msg err">{error}</div>}
      {info && <div className="msg ok">{info}</div>}

      {tab === 'login' && (
        <form onSubmit={handleLogin}>
          <h2>Welcome back 👋</h2>
          <p className="sub">Log in to view your complaints and submit a new one.</p>
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" placeholder="Your password" value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)} />
          <button disabled={busy}>{busy ? 'Please wait…' : 'Login'}</button>
          <p className="muted">No account yet? Click the <b>Register</b> tab above.</p>
        </form>
      )}

      {tab === 'register' && (
        <form onSubmit={handleRegister}>
          <h2>Create account ✨</h2>
          <p className="sub">A new account is always a <b>student</b> — there is no way to become an admin here.</p>
          <label>Full Name</label>
          <input placeholder="e.g. Abdur Rahman Efaj" value={regName}
            onChange={(e) => setRegName(e.target.value)} />
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)} />
          <label>Student ID</label>
          <input placeholder="e.g. S2026001" value={regStudentId}
            onChange={(e) => setRegStudentId(e.target.value)} />
          <label>Password (minimum 8 characters)</label>
          <input type="password" placeholder="Minimum 8 characters" value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)} />
          <button disabled={busy}>{busy ? 'Please wait…' : 'Create Account'}</button>
        </form>
      )}

      {tab === 'forgot' && (
        <form onSubmit={handleForgot}>
          <h2>Forgot Password 🔑</h2>
          <p className="sub">Enter your email. If it is registered, a reset link will be sent. The reply never reveals whether the email exists.</p>
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)} />
          <button disabled={busy}>{busy ? 'Please wait…' : 'Send Reset Link'}</button>
          <p className="muted">In development without SMTP, the reset token is printed in the server log only — never in the API reply.</p>
        </form>
      )}

      {tab === 'reset' && (
        <form onSubmit={handleReset}>
          <h2>Reset Password 🔑</h2>
          <p className="sub">Paste the token from your email (valid for 1 hour, one-time use only), then choose a new password.</p>
          <label>Reset Token</label>
          <input placeholder="Paste the 64-character token here" value={resetToken}
            onChange={(e) => setResetToken(e.target.value)} />
          <label>New Password (minimum 8 characters)</label>
          <input type="password" placeholder="New password" value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)} />
          <button disabled={busy}>{busy ? 'Please wait…' : 'Reset Password'}</button>
        </form>
      )}
    </div>
  )
}
