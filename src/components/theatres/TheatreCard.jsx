import { Link } from 'react-router-dom'
import { directionsUrl } from '../../services/theatreApi'
import { formatShowTime } from '../../utils/format'

export default function TheatreCard({ theatre }) {
  const detailUrl = `/theatres/${theatre.id}`

  return (
    <article className="theatre-card">
      <header className="theatre-card-head">
        <div className="theatre-badges">
          <span className="brand-chip">{theatre.brand}</span>
          <span className="theatre-rating" aria-label={`Rated ${theatre.rating} out of 5`}>
            <span aria-hidden="true">★</span> {theatre.rating}
          </span>
        </div>
        <h3 className="theatre-name">
          <Link to={detailUrl}>{theatre.name}</Link>
        </h3>
        <p className="theatre-address">
          <span aria-hidden="true">📍</span> {theatre.address}
        </p>
      </header>

      <dl className="theatre-stats">
        <div>
          <dt>City</dt>
          <dd>{theatre.city}</dd>
        </div>
        <div>
          <dt>Screens</dt>
          <dd>
            {theatre.screenCount}
            {theatre.openScreens < theatre.screenCount && (
              <span className="stat-sub"> · {theatre.openScreens} open</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Shows today</dt>
          <dd className={theatre.availableShowsToday ? '' : 'is-muted'}>{theatre.availableShowsToday}</dd>
        </div>
      </dl>

      <ul className="format-chips" aria-label="Screen formats">
        {theatre.screenTypes.map((type) => (
          <li key={type}>{type}</li>
        ))}
      </ul>

      <div className="next-shows">
        <p className="next-shows-label">Next shows today</p>
        {theatre.nextShows.length ? (
          <ul>
            {theatre.nextShows.map((show) => (
              <li key={show.id} className={`time-chip is-${show.status}`} title={show.format}>
                {formatShowTime(show.time)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-shows">No more shows today — check tomorrow&apos;s timings.</p>
        )}
      </div>

      <div className="theatre-contact">
        <a href={`tel:${theatre.phone.replace(/\s/g, '')}`}>
          <span aria-hidden="true">📞</span> {theatre.phone}
        </a>
        <a href={`mailto:${theatre.email}`}>
          <span aria-hidden="true">✉️</span> {theatre.email}
        </a>
      </div>

      <div className="theatre-actions">
        <Link to={detailUrl} className="btn btn-primary btn-sm">
          View shows
        </Link>
        <a href={directionsUrl(theatre)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
          Directions ↗
        </a>
      </div>
    </article>
  )
}

export function TheatreCardSkeleton() {
  return (
    <div className="theatre-card skeleton" aria-hidden="true">
      <div className="shimmer line w-40" />
      <div className="shimmer line tall w-80" />
      <div className="shimmer line w-90" />
      <div className="shimmer block" />
      <div className="shimmer line w-70" />
      <div className="shimmer line w-60" />
    </div>
  )
}
