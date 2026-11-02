// Formatting and calculation helpers (no data access here)

function pad(n) {
  return String(n).padStart(2, '0')
}

// Local-time helpers (avoid UTC drift, e.g. in IST)
export function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
export const thisMonthKey = () => todayStr().slice(0, 7)
export const monthKey = (d) => String(d).slice(0, 7)

export function fmtMoney(n) {
  const num = Number(n) || 0
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function monthLabel(mKey) {
  const [y, m] = mKey.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
export function monthLabelShort(mKey) {
  const [y, m] = mKey.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function sumBy(list, type) {
  return list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0)
}

export function expenseByCategory(list) {
  const byCat = {}
  list.filter((t) => t.type === 'expense').forEach((t) => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount
  })
  return byCat
}
