import { useState } from 'react'
import { api, setToken } from '../api.js'

export default function Login({ go, onAuth }) {
  const [role, setRole] = useState('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { token, user } = await api.login(email.trim(), password, role)
      setToken(token)
      onAuth(user)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <a className="back-link" onClick={() => go('home')}>&larr; Back to home</a>
        <div className="auth-mark">Budget Planner</div>
        <h1>Sign in</h1>
        <p className="auth-sub">Keep your income, spending, and savings goals in one ledger.</p>
        <div className="tabs">
          <button type="button" className={role === 'user' ? 'active' : ''} onClick={() => setRole('user')}>User</button>
          <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin</button>
        </div>
        {error && <div className="error-msg show">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="loginEmail">Email</label>
            <input type="email" id="loginEmail" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="loginPassword">Password</label>
            <input type="password" id="loginPassword" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="form-note">New here? <a onClick={() => go('register')}>Create a user account</a></p>
        <div className="hint-box">Demo admin login — email <strong>admin@budget.com</strong>, password <strong>admin123</strong>. Demo user — priya@example.com / demo1234.</div>
      </div>
    </div>
  )
}
