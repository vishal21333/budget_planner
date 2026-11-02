import { useCallback, useEffect, useState } from 'react'
import { ErrorNote, Loading } from '../components/Status.jsx'
import { api } from '../api.js'
import { fmtMoney, monthKey, monthLabelShort, todayStr } from '../utils.js'

function emptyForm(categories) {
  return { type: 'expense', category: categories[0] ? categories[0].name : '', amount: '', date: todayStr(), note: '' }
}

export default function Transactions() {
  const [categories, setCategories] = useState(null)
  const [all, setAll] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState({ type: 'expense', category: '', amount: '', date: todayStr(), note: '' })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fType, setFType] = useState('')
  const [fCat, setFCat] = useState('')
  const [fMonth, setFMonth] = useState('')

  const load = useCallback(() => {
    setLoadError('')
    Promise.all([api.categories(), api.transactions()])
      .then(([cats, txs]) => {
        setCategories(cats)
        setAll(txs)
        setForm((f) => (f.category ? f : { ...f, category: cats[0] ? cats[0].name : '' }))
      })
      .catch((err) => setLoadError(err.message))
  }, [])
  useEffect(load, [load])

  if (loadError) return <ErrorNote message={loadError} onRetry={load} />
  if (!categories || !all) return <Loading />

  const months = Array.from(new Set(all.map((t) => monthKey(t.date)))).sort().reverse()
  let rows = all
  if (fType) rows = rows.filter((t) => t.type === fType)
  if (fCat) rows = rows.filter((t) => t.category === fCat)
  if (fMonth) rows = rows.filter((t) => monthKey(t.date) === fMonth)
  rows = rows.slice().sort((a, b) => b.date.localeCompare(a.date))

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function reset() {
    setEditingId(null)
    setForm(emptyForm(categories))
  }

  async function submit(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.date) {
      alert('Enter a valid amount and date.')
      return
    }
    const body = { type: form.type, category: form.category, amount, date: form.date, note: form.note.trim() }
    setSaving(true)
    try {
      if (editingId) await api.updateTransaction(editingId, body)
      else await api.addTransaction(body)
      setAll(await api.transactions())
      reset()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(t) {
    setEditingId(t.id)
    setForm({ type: t.type, category: t.category, amount: String(t.amount), date: t.date, note: t.note || '' })
  }

  async function remove(id) {
    if (!confirm('Delete this transaction?')) return
    try {
      await api.deleteTransaction(id)
      if (editingId === id) reset()
      setAll(await api.transactions())
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p>Log income and expenses, then filter to find anything.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>{editingId ? 'Edit transaction' : 'Add a transaction'}</h2></div>
        <form className="inline-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="txType">Type</label>
            <select id="txType" value={form.type} onChange={set('type')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="txCategory">Category</label>
            <select id="txCategory" value={form.category} onChange={set('category')}>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="txAmount">Amount (₹)</label>
            <input type="number" id="txAmount" min="1" required value={form.amount} onChange={set('amount')} />
          </div>
          <div className="field">
            <label htmlFor="txDate">Date</label>
            <input type="date" id="txDate" required value={form.date} onChange={set('date')} />
          </div>
          <div className="field">
            <label htmlFor="txNote">Note</label>
            <input type="text" id="txNote" placeholder="Optional" value={form.note} onChange={set('note')} />
          </div>
          <div className="field" style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn" disabled={saving}>{editingId ? 'Save changes' : 'Add entry'}</button>
            {editingId && <button type="button" className="btn ghost" onClick={reset}>Cancel</button>}
          </div>
        </form>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>History</h2></div>
        <div className="filters">
          <select value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={fCat} onChange={(e) => setFCat(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={fMonth} onChange={(e) => setFMonth(e.target.value)}>
            <option value="">All months</option>
            {months.map((m) => <option key={m} value={m}>{monthLabelShort(m)}</option>)}
          </select>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Note</th><th className="right">Amount</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="empty-row"><td colSpan={6}>No transactions match these filters.</td></tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td className="chip">{t.type}</td>
                  <td>{t.category}</td>
                  <td>{t.note || '—'}</td>
                  <td className={(t.type === 'income' ? 'amt-income' : 'amt-expense') + ' right figure'}>
                    {t.type === 'income' ? '+ ' : '– '}{fmtMoney(t.amount)}
                  </td>
                  <td className="actions">
                    <button onClick={() => startEdit(t)}>Edit</button>
                    <button onClick={() => remove(t.id)}>Delete</button>
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
