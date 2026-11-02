export default function Home({ go }) {
  return (
    <div className="home-shell">
      <div className="home-nav">
        <div className="mark">Budget Planner</div>
        <div className="actions">
          <button type="button" className="btn ghost small" onClick={() => go('login')}>Sign in</button>
          <button type="button" className="btn switch small" onClick={() => go('register')}>Create account</button>
        </div>
      </div>
      <div className="home-hero">
        <h1>Know where every rupee goes.</h1>
        <p>Track income and expenses, set savings goals, and catch overspending before it happens — a simple ledger for your everyday finances.</p>
        <div className="home-cta">
          <button type="button" className="btn" onClick={() => go('register')}>Get started — it's free</button>
          <button type="button" className="btn ghost" onClick={() => go('login')}>I already have an account</button>
        </div>
      </div>
      <div className="home-features">
        <div className="feature-card"><div className="icon">📊</div><h3>Visual spending breakdown</h3><p>A category-by-category pie chart shows exactly where your money went this month.</p></div>
        <div className="feature-card"><div className="icon">🎯</div><h3>Savings goals</h3><p>Set a monthly target and track real-time progress as income and expenses come in.</p></div>
        <div className="feature-card"><div className="icon">🔔</div><h3>Overspend alerts</h3><p>Get a clear warning the moment a category — or your whole budget — goes over.</p></div>
        <div className="feature-card"><div className="icon">🛠️</div><h3>Admin controls</h3><p>Admins manage categories, spending caps, and every registered user from one dashboard.</p></div>
      </div>
      <div className="home-footer">Demo admin login — admin@budget.com / admin123</div>
    </div>
  )
}
