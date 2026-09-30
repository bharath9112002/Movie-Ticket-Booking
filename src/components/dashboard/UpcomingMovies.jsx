import { startOfDay } from '../../data/dashboardData'
import { formatDate } from '../../utils/format'
import { posterStyle } from '../../utils/posters'

const DAY = 24 * 60 * 60 * 1000

const daysUntil = (date) => Math.round((startOfDay(date) - startOfDay(new Date())) / DAY)

const releaseIn = (days) => {
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default function UpcomingMovies({ movies }) {
  return (
    <section className="panel upcoming fade-up" style={{ '--i': 9 }}>
      <header className="panel-head">
        <h2>Upcoming movies</h2>
        <span className="panel-tag">{movies.length} scheduled</span>
      </header>

      <ul className="upcoming-list">
        {movies.map((m) => {
          const days = daysUntil(m.releaseDate)
          return (
            <li key={m.id} className="upcoming-item">
              <span className="poster" style={posterStyle(m.genre)} aria-hidden="true">
                {m.title.charAt(0)}
              </span>
              <div className="upcoming-info">
                <p className="upcoming-title">{m.title}</p>
                <p className="upcoming-meta">
                  <span className="genre-chip">{m.genre}</span>
                  {m.language} · {m.duration} min
                </p>
              </div>
              <div className="upcoming-date">
                <span className={`countdown${days <= 3 ? ' is-soon' : ''}`}>{releaseIn(days)}</span>
                <span className="date">{formatDate(m.releaseDate)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
