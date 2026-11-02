import { useCallback, useEffect, useState } from 'react'
import PieChart from '../components/PieChart.jsx'
import { ErrorNote, Loading } from '../components/Status.jsx'
import { api } from '../api.js'
import { fmtMoney, thisMonthKey } from '../utils.js'

export default function Admin() {
  const [overview, setOverview] = useState(null)
  const [categories, setCategories] = useState(null)
  const [error, setError] = useState('')
  const [catName, setCatName] = useState('')
  const [catCap, setCatCap] = useState('')

  const load = useCallback(() => {
    setError('')
    return Promise.all([api.adminOverview(thisMonthKey()), api.categories()])
      .then(([o, c]) => {
        setOverview(o)
        setCategories(c)
      })
      .catch((err) => setError(err.message))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (error) return <ErrorNote message={error} onRetry={load} />
  if (!overview || !categories) return <Loading />

  const users = overview.users
  const slices = categories
    .map((c) => ({ name: c.name, value: overview.byCategory[c.name] || 0, color: c.color }))
    .filter((s) => s.value > 0)

  async function addCat(e) {
    e.preventDefault()
    const name = catName.trim()
    if (!name) return
    try {
      await api.addCategory(name, Number(catCap) || 0)
      setCatName('')
      setCatCap('')
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function removeCat(id) {
    if (!confirm('Delete this category?')) return
    try {
      await api.deleteCategory(id)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function removeUser(id) {
    if (!confirm('Remove this user and all of their transactions?')) return
    try {
      await api.deleteUser(id)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>System overview</h1>
          <p>Everyone's spending, at a glance, plus account and category controls.</p>
        </div>
      </div>
      <div className="summary-row">
        <div className="summary-cell"><div className="label">Registered users</div><div className="value figure">{users.length}</div></div>
        <div className="summary-cell"><div className="label">Income (this month)</div><div className="value figure green">{fmtMoney(overview.monthIncome)}</div></div>
        <div className="summary-cell"><div className="label">Expenses (this month)</div><div className="value figure rust">{fmtMoney(overview.monthExpense)}</div></div>
        <div className="summary-cell"><div className="label">Net</div><div className="value figure gold">{fmtMoney(overview.monthIncome - overview.monthExpense)}</div></div>
      </div>
      <div className="two-col">
        <div className="panel">
          <div className="panel-head"><h2>Spending by category — all users</h2></div>
          <PieChart slices={slices} />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Categories</h2></div>
          <form className="inline-form" style={{ gridTemplateColumns: '2fr 1fr 1fr', marginBottom: 18 }} onSubmit={addCat}>
            <div className="field">
              <label htmlFor="catName">Name</label>
              <input type="text" id="catName" required placeholder="e.g. Travel" value={catName} onChange={(e) => setCatName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="catCap">Monthly cap (₹)</label>
              <input type="number" id="catCap" min="0" placeholder="0 = no cap" value={catCap} onChange={(e) => setCatCap(e.target.value)} />
            </div>
            <button type="submit" className="btn">Add</button>
          </form>
          <table>
            <thead><tr><th>Category</th><th className="right">Cap</th><th></th></tr></thead>
            <tbody>
              {categories.length === 0 ? (
                <tr className="empty-row"><td colSpan={3}>No categories yet.</td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td><span className="cat-swatch" style={{ display: 'inline-block', marginRight: 8, background: c.color }} />{c.name}</td>
                    <td className="right figure">{c.cap ? fmtMoney(c.cap) : 'no cap'}</td>
                    <td className="actions"><button onClick={() => removeCat(c.id)}>Delete</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>Users</h2></div>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th className="right">Total income</th><th className="right">Total expenses</th><th></th></tr></thead>
          <tbody>
            {users.length === 0 ? (
              <tr className="empty-row"><td colSpan={5}>No registered users yet.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td className="right figure">{fmtMoney(u.totalIncome)}</td>
                  <td className="right figure">{fmtMoney(u.totalExpense)}</td>
                  <td className="actions"><button onClick={() => removeUser(u.id)}>Remove</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
