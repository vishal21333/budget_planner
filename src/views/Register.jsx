import { useState } from 'react'
import { api, setToken } from '../api.js'

export default function Register({ go, onAuth }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [income, setIncome] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || password.length < 4) {
      setError('Fill in every field. Password needs at least 4 characters.')
      return
    }
    setBusy(true)
    try {
      const { token, user } = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        monthlyIncome: Number(income) || 0,
      })
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
        <h1>Create your account</h1>
        <p className="auth-sub">Set up a personal ledger for income, expenses, and goals.</p>
        {error && <div className="error-msg show">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="regName">Full name</label>
            <input type="text" id="regName" required placeholder="Asha Rao" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="regEmail">Email</label>
            <input type="email" id="regEmail" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="regPassword">Password</label>
            <input type="password" id="regPassword" required placeholder="At least 4 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="regIncome">Average monthly income (optional)</label>
            <input type="number" id="regIncome" min="0" placeholder="e.g. 40000" value={income} onChange={(e) => setIncome(e.target.value)} />
          </div>
          <button type="submit" className="btn block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="form-note">Already registered? <a onClick={() => go('login')}>Sign in</a></p>
      </div>
    </div>
  )
}
