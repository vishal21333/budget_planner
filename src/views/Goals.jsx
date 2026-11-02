import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorNote, Loading } from '../components/Status.jsx'
import { api } from '../api.js'
import { fmtMoney, monthKey, monthLabel, sumBy, thisMonthKey } from '../utils.js'

export default function Goals({ user, onUserChange }) {
  const [tx, setTx] = useState(null)
  const [error, setError] = useState('')
  const [goal, setGoal] = useState(user.savingsGoal ? String(user.savingsGoal) : '')
  const [income, setIncome] = useState(user.monthlyIncome ? String(user.monthlyIncome) : '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const load = useCallback(() => {
    setError('')
    api.transactions().then(setTx).catch((err) => setError(err.message))
  }, [])
  useEffect(load, [load])

  if (error) return <ErrorNote message={error} onRetry={load} />
  if (!tx) return <Loading />

  const mKey = thisMonthKey()
  const txMonth = tx.filter((t) => monthKey(t.date) === mKey)
  const monthIncome = (Number(user.monthlyIncome) || 0) + sumBy(txMonth, 'income')
  const savedAmt = monthIncome - sumBy(txMonth, 'expense')
  const goalNum = Number(user.savingsGoal) || 0
  const pct = goalNum > 0 ? Math.max(0, Math.min(100, Math.round((savedAmt / goalNum) * 100))) : 0
  const months = Array.from(new Set([...tx.map((t) => monthKey(t.date)), mKey])).sort().reverse().slice(0, 6)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { user: updated } = await api.updateMe({ savingsGoal: Number(goal) || 0, monthlyIncome: Number(income) || 0 })
      onUserChange(updated)
      setSaved(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Goals &amp; monthly summary</h1>
          <p>Set a savings target and see how each month closed out.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="panel">
          <div className="panel-head"><h2>This month's savings</h2></div>
          <p className="muted" style={{ margin: '0 0 4px' }}>Saved so far</p>
          <h1 className="figure">{fmtMoney(savedAmt)}</h1>
          <p className="muted" style={{ margin: '2px 0 0' }}>Goal: <span>{goalNum ? fmtMoney(goalNum) : 'not set'}</span></p>
          <div className="progress-track">
            <div className={'progress-fill' + (savedAmt < 0 && goalNum > 0 ? ' over' : '')} style={{ width: pct + '%' }} />
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {goalNum > 0 ? pct + "% of this month's goal" : 'Set a monthly goal below to track progress.'}
          </p>
          <form onSubmit={submit} style={{ marginTop: 22 }}>
            <div className="field">
              <label htmlFor="incomeInput">Average monthly income (₹)</label>
              <input type="number" id="incomeInput" min="0" value={income} onChange={(e) => setIncome(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="goalInput">Monthly savings goal (₹)</label>
              <input type="number" id="goalInput" min="0" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <button type="submit" className="btn" disabled={saving}>Save goal</button>
            {saved && <span className="muted" style={{ marginLeft: 10 }}>Saved.</span>}
          </form>
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Monthly summary</h2></div>
          <table>
            <thead><tr><th>Month</th><th className="right">Income</th><th className="right">Expenses</th><th className="right">Net</th></tr></thead>
            <tbody>
              {months.map((m) => {
                const rows = tx.filter((t) => monthKey(t.date) === m)
                const inc = sumBy(rows, 'income') + (m === mKey ? Number(user.monthlyIncome) || 0 : 0)
                const exp = sumBy(rows, 'expense')
                const net = inc - exp
                return (
                  <tr key={m}>
                    <td>{monthLabel(m)}</td>
                    <td className="right figure">{fmtMoney(inc)}</td>
                    <td className="right figure">{fmtMoney(exp)}</td>
                    <td className={'right figure ' + (net >= 0 ? 'amt-income' : 'amt-expense')}>{fmtMoney(net)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
