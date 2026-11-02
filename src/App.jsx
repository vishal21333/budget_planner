import { useEffect, useState } from 'react'
import { api, clearToken, getToken } from './api.js'
import Shell from './components/Shell.jsx'
import { Loading } from './components/Status.jsx'
import Home from './views/Home.jsx'
import Login from './views/Login.jsx'
import Register from './views/Register.jsx'
import Dashboard from './views/Dashboard.jsx'
import Transactions from './views/Transactions.jsx'
import Goals from './views/Goals.jsx'
import Admin from './views/Admin.jsx'

const PUBLIC_VIEWS = ['home', 'login', 'register']

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('home')
  const [booting, setBooting] = useState(() => !!getToken())

  // Restore the session if a token is saved
  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then(({ user }) => {
        setUser(user)
        setView(user.role === 'admin' ? 'admin' : 'dashboard')
      })
      .catch((err) => {
        if (err.status === 401) clearToken()
      })
      .finally(() => setBooting(false))
  }, [])

  const onAuth = (u) => {
    setUser(u)
    setView(u.role === 'admin' ? 'admin' : 'dashboard')
  }
  const onLogout = () => {
    clearToken()
    setUser(null)
    setView('home')
  }

  if (booting) return <Loading />

  // Not signed in: only public pages
  if (!user) {
    if (view === 'login') return <Login go={setView} onAuth={onAuth} />
    if (view === 'register') return <Register go={setView} onAuth={onAuth} />
    return <Home go={setView} />
  }

  const isAdmin = user.role === 'admin'
  const current = isAdmin ? 'admin' : PUBLIC_VIEWS.includes(view) ? 'dashboard' : view

  let page
  if (isAdmin) page = <Admin />
  else if (current === 'transactions') page = <Transactions />
  else if (current === 'goals') page = <Goals user={user} onUserChange={setUser} />
  else page = <Dashboard user={user} setView={setView} />

  return (
    <Shell view={current} setView={setView} user={user} onLogout={onLogout}>
      {page}
    </Shell>
  )
}
