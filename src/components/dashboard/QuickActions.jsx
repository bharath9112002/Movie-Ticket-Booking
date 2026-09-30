import { Link } from 'react-router-dom'

const ACTIONS = [
  { to: '/movies/new', icon: '🎞️', title: 'Add movie', text: 'List a new release', tone: 'accent' },
  { to: '/theatres/new', icon: '🏛️', title: 'Add theatre', text: 'Register a venue', tone: 'blue' },
  { to: '/shows/new', icon: '🗓️', title: 'Schedule show', text: 'Assign movie to a screen', tone: 'green' },
  { to: '/bookings', icon: '🎟️', title: 'Manage bookings', text: 'Review and update tickets', tone: 'violet' },
]

export default function QuickActions() {
  return (
    <section className="quick-actions fade-up" style={{ '--i': 6 }} aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="section-title">Quick actions</h2>
      <div className="action-grid">
        {ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className={`action-card tone-${a.tone}`}>
            <span className="action-icon" aria-hidden="true">{a.icon}</span>
            <span className="action-text-wrap">
              <span className="action-title">{a.title}</span>
              <span className="action-text">{a.text}</span>
            </span>
            <span className="action-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
