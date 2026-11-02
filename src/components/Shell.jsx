const USER_NAV = [
  ['dashboard', 'Overview'],
  ['transactions', 'Transactions'],
  ['goals', 'Goals & summary'],
]

export default function Shell({ view, setView, user, onLogout, children }) {
  const isAdmin = user.role === 'admin'
  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="rail-mark">Budget Planner</div>
        <div className="rail-sub">{isAdmin ? 'Admin module' : 'User module'}</div>
        <nav>
          {isAdmin ? (
            <a className="active">Overview &amp; management</a>
          ) : (
            USER_NAV.map(([key, label]) => (
              <a key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
                {label}
              </a>
            ))
          )}
        </nav>
        <div className="rail-user">
          <div className="name">{user.name}</div>
          <div className="role">{isAdmin ? 'Administrator' : 'Account holder'}</div>
          <button className="btn switch small block" onClick={onLogout}>
            Switch Account
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
