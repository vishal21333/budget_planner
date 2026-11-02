// Data layer backed by browser Local Storage (no server needed).
// Every function returns a Promise so the screens work the same way as with a real API.

const K = { users: 'bp_users', categories: 'bp_categories', transactions: 'bp_transactions', token: 'bp_token', seeded: 'bp_seeded_v3' }

/* ---------- low-level helpers ---------- */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {}
}
const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const pad = (n) => String(n).padStart(2, '0')
function monthsBackDate(back, day) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - back)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(day)
}
function fail(message, status) {
  const err = new Error(message)
  err.status = status
  throw err
}
const publicUser = (u) => {
  const { password, ...rest } = u
  return rest
}
const sum = (list, type) => list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0)

/* ---------- first-run demo data ---------- */
function seed() {
  if (localStorage.getItem(K.seeded)) return
  write(K.seeded, true)
  write(K.categories, [
    { id: uid('cat'), name: 'Housing', cap: 15000, color: '#1E2A38' },
    { id: uid('cat'), name: 'Food', cap: 8000, color: '#3F6E52' },
    { id: uid('cat'), name: 'Transport', cap: 4000, color: '#B7893F' },
    { id: uid('cat'), name: 'Utilities', cap: 3500, color: '#45566B' },
    { id: uid('cat'), name: 'Health', cap: 3000, color: '#8A9AAC' },
    { id: uid('cat'), name: 'Entertainment', cap: 2500, color: '#B3492D' },
    { id: uid('cat'), name: 'Other', cap: 0, color: '#C9BFA5' },
  ])
  const now = new Date().toISOString()
  const admin = { id: uid('usr'), name: 'Admin', email: 'admin@budget.com', password: 'admin123', role: 'admin', monthlyIncome: 0, savingsGoal: 0, createdAt: now }
  const priya = { id: uid('usr'), name: 'Priya Sharma', email: 'priya@example.com', password: 'demo1234', role: 'user', monthlyIncome: 45000, savingsGoal: 8000, createdAt: now }
  const rahul = { id: uid('usr'), name: 'Rahul Verma', email: 'rahul@example.com', password: 'demo1234', role: 'user', monthlyIncome: 35000, savingsGoal: 5000, createdAt: now }
  write(K.users, [admin, priya, rahul])

  const tx = []
  const add = (u, type, category, amount, back, day, note) =>
    tx.push({ id: uid('tx'), userId: u.id, type, category, amount, date: monthsBackDate(back, day), note: note || '' })
  ;[2, 1, 0].forEach((mb) => {
    add(priya, 'expense', 'Housing', 15000, mb, 2, 'Rent')
    add(priya, 'expense', 'Food', 5200 + mb * 150, mb, 6, 'Groceries')
    add(priya, 'expense', 'Transport', 2600, mb, 9, 'Metro pass')
    add(priya, 'expense', 'Utilities', 2900, mb, 11, 'Electricity + wifi')
    add(priya, 'expense', 'Entertainment', 1400, mb, 15, 'Movies, subscriptions')
    add(priya, 'expense', 'Health', 900, mb, 18, 'Pharmacy')
  })
  add(priya, 'income', 'Other', 6000, 1, 20, 'Freelance design work')
  const rahulMonths = [
    [2, 7200, 3600, 3100, 2100, 0],
    [1, 8400, 4300, 3400, 2600, 0],
    [0, 9500, 4500, 3600, 3200, 2000],
  ]
  rahulMonths.forEach(([mb, food, transport, utilities, fun, health]) => {
    add(rahul, 'expense', 'Housing', 15000, mb, 3, 'Rent')
    add(rahul, 'expense', 'Food', food, mb, 7, 'Groceries + eating out')
    add(rahul, 'expense', 'Transport', transport, mb, 9, 'Fuel + cab rides')
    add(rahul, 'expense', 'Utilities', utilities, mb, 12, 'Electricity + phone')
    add(rahul, 'expense', 'Entertainment', fun, mb, 15, 'Streaming, outings')
    if (health) add(rahul, 'expense', 'Health', health, mb, 16, 'Dental checkup')
  })
  write(K.transactions, tx)
}
seed()

/* ---------- session token (just the user's id) ---------- */
export function getToken() {
  try {
    return localStorage.getItem(K.token)
  } catch (e) {
    return null
  }
}
export function setToken(token) {
  try {
    localStorage.setItem(K.token, token)
  } catch (e) {}
}
export function clearToken() {
  try {
    localStorage.removeItem(K.token)
  } catch (e) {}
}
function me() {
  const id = getToken()
  const user = id && read(K.users, []).find((u) => u.id === id)
  if (!user) fail('Not signed in.', 401)
  return user
}
function admin() {
  const u = me()
  if (u.role !== 'admin') fail('Admins only.', 403)
  return u
}

/* ---------- the API used by the screens ---------- */
const done = (fn) =>
  new Promise((resolve, reject) => {
    try {
      resolve(fn())
    } catch (e) {
      reject(e)
    }
  })

export const api = {
  /* auth */
  login: (email, password, role) =>
    done(() => {
      const user = read(K.users, []).find((u) => u.email.toLowerCase() === String(email).toLowerCase())
      if (!user || user.password !== password) fail("That email or password doesn't match our records.", 401)
      if (user.role !== role) fail('This account is not registered as ' + role + '. Switch tabs and try again.', 403)
      return { token: user.id, user: publicUser(user) }
    }),

  register: (body) =>
    done(() => {
      const name = String(body.name || '').trim()
      const email = String(body.email || '').trim()
      const password = String(body.password || '')
      if (!name || !email || password.length < 4) fail('Fill in every field. Password needs at least 4 characters.', 400)
      const users = read(K.users, [])
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) fail('An account with that email already exists.', 409)
      const user = { id: uid('usr'), name, email, password, role: 'user', monthlyIncome: Math.max(0, Number(body.monthlyIncome) || 0), savingsGoal: 0, createdAt: new Date().toISOString() }
      users.push(user)
      write(K.users, users)
      return { token: user.id, user: publicUser(user) }
    }),

  me: () => done(() => ({ user: publicUser(me()) })),

  updateMe: (body) =>
    done(() => {
      const current = me()
      const users = read(K.users, [])
      const i = users.findIndex((u) => u.id === current.id)
      if (body.monthlyIncome !== undefined) users[i].monthlyIncome = Math.max(0, Number(body.monthlyIncome) || 0)
      if (body.savingsGoal !== undefined) users[i].savingsGoal = Math.max(0, Number(body.savingsGoal) || 0)
      write(K.users, users)
      return { user: publicUser(users[i]) }
    }),

  /* categories */
  categories: () =>
    done(() => {
      me()
      return read(K.categories, [])
    }),
  addCategory: (name, cap) =>
    done(() => {
      admin()
      const n = String(name || '').trim()
      if (!n) fail('Category name is required.', 400)
      const list = read(K.categories, [])
      if (list.some((c) => c.name.toLowerCase() === n.toLowerCase())) fail('That category already exists.', 409)
      const palette = ['#1E2A38', '#3F6E52', '#B7893F', '#45566B', '#8A9AAC', '#B3492D', '#C9BFA5', '#6E4E9E']
      const category = { id: uid('cat'), name: n, cap: Math.max(0, Number(cap) || 0), color: palette[Math.floor(Math.random() * palette.length)] }
      list.push(category)
      write(K.categories, list)
      return { category }
    }),
  deleteCategory: (id) =>
    done(() => {
      admin()
      write(K.categories, read(K.categories, []).filter((c) => c.id !== id))
      return { ok: true }
    }),

  /* transactions (always the signed-in user's own) */
  transactions: () =>
    done(() => {
      const u = me()
      return read(K.transactions, []).filter((t) => t.userId === u.id)
    }),
  addTransaction: (body) =>
    done(() => {
      const u = me()
      const list = read(K.transactions, [])
      const transaction = { id: uid('tx'), userId: u.id, type: body.type, category: body.category, amount: Number(body.amount), date: body.date, note: body.note || '' }
      list.push(transaction)
      write(K.transactions, list)
      return { transaction }
    }),
  updateTransaction: (id, body) =>
    done(() => {
      const u = me()
      const list = read(K.transactions, [])
      const i = list.findIndex((t) => t.id === id && t.userId === u.id)
      if (i === -1) fail('Transaction not found.', 404)
      list[i] = { ...list[i], type: body.type, category: body.category, amount: Number(body.amount), date: body.date, note: body.note || '' }
      write(K.transactions, list)
      return { transaction: list[i] }
    }),
  deleteTransaction: (id) =>
    done(() => {
      const u = me()
      write(K.transactions, read(K.transactions, []).filter((t) => !(t.id === id && t.userId === u.id)))
      return { ok: true }
    }),

  /* admin */
  adminOverview: (month) =>
    done(() => {
      admin()
      const users = read(K.users, []).filter((u) => u.role === 'user')
      const ids = new Set(users.map((u) => u.id))
      const tx = read(K.transactions, []).filter((t) => ids.has(t.userId))
      const monthTx = tx.filter((t) => t.date.slice(0, 7) === month)
      const byCategory = {}
      monthTx.filter((t) => t.type === 'expense').forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
      })
      return {
        month,
        users: users.map((u) => {
          const mine = tx.filter((t) => t.userId === u.id)
          return { id: u.id, name: u.name, email: u.email, totalIncome: sum(mine, 'income') + (u.monthlyIncome || 0), totalExpense: sum(mine, 'expense') }
        }),
        monthIncome: sum(monthTx, 'income') + users.reduce((s, u) => s + (u.monthlyIncome || 0), 0),
        monthExpense: sum(monthTx, 'expense'),
        byCategory,
      }
    }),
  deleteUser: (id) =>
    done(() => {
      admin()
      const target = read(K.users, []).find((u) => u.id === id)
      if (!target) fail('User not found.', 404)
      if (target.role === 'admin') fail('Admin accounts cannot be removed here.', 400)
      write(K.users, read(K.users, []).filter((u) => u.id !== id))
      write(K.transactions, read(K.transactions, []).filter((t) => t.userId !== id))
      return { ok: true }
    }),
}
