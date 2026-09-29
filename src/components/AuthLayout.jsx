export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-hero" aria-hidden="true">
        <div className="brand">
          <span className="brand-mark">🎬</span> CineBook
        </div>
        <h2>Your next favourite movie is one seat away.</h2>
        <p>Book tickets, pick your seats and skip the queue.</p>
      </aside>
      <main className="auth-panel">
        <div className="auth-card">
          <div className="brand brand-mobile">
            <span className="brand-mark">🎬</span> CineBook
          </div>
          <h1>{title}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </main>
    </div>
  )
}
