import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusMessage from '../common/StatusMessage'
import { PosterImage } from '../movies/MovieCard'
import { getShowtimes } from '../../services/theatreApi'
import { languageName, usingMockData } from '../../services/tmdb'
import { formatShowTime } from '../../utils/format'

const STATUS_LABELS = {
  available: 'Available',
  filling_fast: 'Filling fast',
  sold_out: 'Sold out',
  past: 'Started',
}

const dateLabel = (key, index) => {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    top: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' }),
    bottom: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }
}

export default function ShowTimings({ theatreId, dates, selectedDate, onSelectDate }) {
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${theatreId}|${selectedDate}|${reloadKey}`
  const [response, setResponse] = useState({ key: null })
  const state = response.key === requestKey ? response : { status: 'loading' }

  useEffect(() => {
    const controller = new AbortController()
    getShowtimes(theatreId, selectedDate, { signal: controller.signal })
      .then((groups) => setResponse({ key: requestKey, status: 'success', groups }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResponse({ key: requestKey, status: 'error', error })
      })
    return () => controller.abort()
  }, [theatreId, selectedDate, requestKey])

  const bookableCount =
    state.status === 'success'
      ? state.groups.reduce((n, g) => n + g.shows.filter((s) => s.status === 'available' || s.status === 'filling_fast').length, 0)
      : null

  return (
    <section className="showtimes" aria-labelledby="showtimes-title">
      <header className="showtimes-head">
        <h2 id="showtimes-title">Show timings</h2>
        {bookableCount !== null && (
          <span className="panel-tag">{bookableCount} shows available</span>
        )}
      </header>

      <div className="date-tabs" role="group" aria-label="Choose a date">
        {dates.map((key, i) => {
          const label = dateLabel(key, i)
          return (
            <button
              key={key}
              type="button"
              aria-pressed={key === selectedDate}
              className="date-tab"
              onClick={() => onSelectDate(key)}
            >
              <span className="date-top">{label.top}</span>
              <span className="date-bottom">{label.bottom}</span>
            </button>
          )
        })}
      </div>

      <ul className="show-legend" aria-label="Legend">
        <li className="is-available">Available</li>
        <li className="is-filling_fast">Filling fast</li>
        <li className="is-sold_out">Sold out</li>
      </ul>

      {state.status === 'loading' ? (
        <div className="showtime-groups" aria-busy="true" aria-label="Loading show timings">
          {[0, 1, 2].map((i) => (
            <div key={i} className="showtime-group skeleton">
              <div className="showtime-poster shimmer" />
              <div className="showtime-body">
                <div className="shimmer line w-50" />
                <div className="shimmer line w-30" />
                <div className="shimmer line w-90" />
              </div>
            </div>
          ))}
        </div>
      ) : state.status === 'error' ? (
        <StatusMessage
          icon="⚠️"
          title="Couldn't load show timings"
          message={state.error.message}
          action={
            <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          }
        />
      ) : state.groups.length === 0 ? (
        <StatusMessage icon="🎞️" title="No shows scheduled" message="There are no shows on this date. Try another day." />
      ) : (
        <div className="showtime-groups">
          {state.groups.map(({ movie, shows }) => (
            <article key={movie.id} className="showtime-group">
              <div className="showtime-poster">
                <PosterImage path={movie.poster_path} fallback={movie.poster_fallback} title={movie.title} size="w185" />
              </div>
              <div className="showtime-body">
                <h3 className="showtime-title">
                  {/* Demo movies have detail pages; live TMDB ids won't match these. */}
                  {usingMockData ? <Link to={`/movies/${movie.id}`}>{movie.title}</Link> : movie.title}
                </h3>
                <p className="showtime-meta">
                  {languageName(movie.original_language)} · ★ {movie.vote_average.toFixed(1)}
                </p>
                <ul className="time-list">
                  {shows.map((show) => {
                    const bookable = show.status === 'available' || show.status === 'filling_fast'
                    const detail = `${show.screenName} · ${show.format} · ₹${show.price} · ${
                      show.status === 'past' ? 'already started' : `${show.availableSeats} of ${show.totalSeats} seats left`
                    }`
                    const content = (
                      <>
                        <span className="time-value">{formatShowTime(show.time)}</span>
                        <span className="time-format">{show.format}</span>
                      </>
                    )
                    return (
                      <li key={show.id}>
                        {bookable ? (
                          <Link
                            to={`/shows/${encodeURIComponent(show.id)}/seats`}
                            className={`time-slot is-${show.status}`}
                            title={detail}
                            aria-label={`${formatShowTime(show.time)}, ${detail}, ${STATUS_LABELS[show.status]}`}
                          >
                            {content}
                          </Link>
                        ) : (
                          <span
                            className={`time-slot is-${show.status}`}
                            title={detail}
                            aria-label={`${formatShowTime(show.time)}, ${STATUS_LABELS[show.status]}`}
                          >
                            {content}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
