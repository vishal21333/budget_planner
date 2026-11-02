import { useCallback, useEffect, useState } from 'react'
import PieChart from '../components/PieChart.jsx'
import { ErrorNote, Loading } from '../components/Status.jsx'
import { api } from '../api.js'
import {
  expenseByCategory,
  fmtMoney,
  monthKey,
  monthLabel,
  sumBy,
  thisMonthKey,
} from '../utils.js'

export default function Dashboard({ user, setView }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    Promise.all([api.categories(), api.transactions()])
      .then(([categories, transactions]) => setData({ categories, transactions }))
      .catch((err) => setError(err.message))
  }, [])
  useEffect(load, [load])

  if (error) return <ErrorNote message={error} onRetry={load} />
  if (!data) return <Loading />

  const { categories, transactions: txAll } = data
  const mKey = thisMonthKey()
  const txMonth = txAll.filter((t) => monthKey(t.date) === mKey)
  const income = sumBy(txMonth, 'income') + (Number(user.monthlyIncome) || 0)
  const expense = sumBy(txMonth, 'expense')
  const balance = income - expense
  const byCat = expenseByCategory(txMonth)
  const overCats = categories.filter((c) => c.cap > 0 && (byCat[c.name] || 0) > c.cap)
  const slices = categories.map((c) => ({ name: c.name, value: byCat[c.name] || 0, color: c.color })).filter((s) => s.value > 0)
  const recent = txAll.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  let alert
  if (expense > income) {
    alert = (
      <div className="alert">
        <strong>You are overspending this month.</strong>
        Expenses ({fmtMoney(expense)}) have gone past income ({fmtMoney(income)}).
      </div>
    )
  } else if (overCats.length) {
    alert = (
      <div className="alert">
        <strong>Some categories are over budget.</strong>
        {overCats.map((c) => c.name + ' (' + fmtMoney(byCat[c.name]) + ' of ' + fmtMoney(c.cap) + ')').join(', ')}.
      </div>
    )
  } else {
    alert = (
      <div className="alert ok">
        <strong>You are within budget.</strong>
        Spending is on track for {monthLabel(mKey)}.
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>This month's overview</h1>
          <p>Where your money came from, and where it went.</p>
        </div>
      </div>
      {alert}
      <div className="summary-row">
        <div className="summary-cell"><div className="label">Income</div><div className="value figure green">{fmtMoney(income)}</div></div>
        <div className="summary-cell"><div className="label">Expenses</div><div className="value figure rust">{fmtMoney(expense)}</div></div>
        <div className="summary-cell"><div className="label">Balance</div><div className={'value figure ' + (balance >= 0 ? 'green' : 'rust')}>{fmtMoney(balance)}</div></div>
      </div>
      <div className="two-col">
        <div className="panel">
          <div className="panel-head"><h2>Spending by category</h2></div>
          <PieChart slices={slices} />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Category budgets</h2></div>
          <div className="cat-list">
            {categories.map((c) => {
              const spent = byCat[c.name] || 0
              const cap = c.cap || 0
              const pct = cap ? Math.min(100, Math.round((spent / cap) * 100)) : spent > 0 ? 100 : 0
              const over = cap > 0 && spent > cap
              return (
                <div className="cat-row" key={c.id}>
                  <span className="cat-swatch" style={{ background: c.color }} />
                  <span className="cat-name">{c.name}</span>
                  <span className="cat-bar-track"><span className={'cat-bar-fill' + (over ? ' over' : '')} style={{ width: pct + '%' }} /></span>
                  <span className="cat-amt">{fmtMoney(spent)}{cap ? ' / ' + fmtMoney(cap) : ' / no cap'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h2>Recent transactions</h2>
          <a className="btn ghost small" onClick={() => setView('transactions')}>Add / manage</a>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Note</th><th className="right">Amount</th></tr></thead>
          <tbody>
            {recent.length === 0 ? (
              <tr className="empty-row"><td colSpan={4}>No transactions yet. Add one from the Transactions page.</td></tr>
            ) : (
              recent.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.category}</td>
                  <td>{t.note || '—'}</td>
                  <td className={(t.type === 'income' ? 'amt-income' : 'amt-expense') + ' right figure'}>
                    {t.type === 'income' ? '+ ' : '– '}{fmtMoney(t.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
