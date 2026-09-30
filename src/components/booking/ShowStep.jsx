import { Link } from 'react-router-dom'
import StepError from './StepError'
import useAsync from '../../hooks/useAsync'
import { getShowtimes, upcomingDates } from '../../services/theatreApi'
import { bookingUrl, urlForStep } from '../../utils/bookingFlow'
import { formatCurrency, formatShowTime } from '../../utils/format'

const dateLabel = (key, index) => {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    top: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' }),
    bottom: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }
}

const STATUS_TEXT = { available: 'Available', filling_fast: 'Filling fast', sold_out: 'Sold out', past: 'Started' }

export default function ShowStep({ state }) {
  const dates = upcomingDates()
  const date = dates.includes(state.date) ? state.date : dates[0]
  const showtimes = useAsync((signal) => getShowtimes(state.theatre, date, { signal }), `${state.theatre}|${date}`)

  const shows =
    showtimes.status === 'success'
      ? showtimes.data.find((g) => String(g.movie.id) === state.movie)?.shows ?? []
      : []

  return (
    <section aria-labelledby="step-title">
      <div className="step-head">
        <h2 id="step-title">Choose a date and show time</h2>
      </div>

      <div className="date-tabs" role="group" aria-label="Choose a date">
        {dates.map((key, i) => {
          const label = dateLabel(key, i)
          return (
            <Link
              key={key}
              to={bookingUrl({ movie: state.movie, theatre: state.theatre, date: key === dates[0] ? '' : key })}
              replace
              className="date-tab"
              aria-pressed={key === date}
            >
              <span className="date-top">{label.top}</span>
              <span className="date-bottom">{label.bottom}</span>
            </Link>
          )
        })}
      </div>

      {showtimes.status === 'loading' ? (
        <div className="time-list step-times" aria-busy="true" aria-label="Loading show times">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="time-skeleton shimmer" />
          ))}
        </div>
      ) : showtimes.status === 'error' ? (
        <StepError
          error={showtimes.error}
          onRetry={showtimes.reload}
          back={<Link to={urlForStep(state, 'theatre')} className="btn btn-outline">Choose another theatre</Link>}
        />
      ) : shows.length === 0 ? (
        <p className="step-empty">No shows of this movie here on this date. Try another day or theatre.</p>
      ) : (
        <ul className="time-list step-times">
          {shows.map((show) => {
            const bookable = show.status === 'available' || show.status === 'filling_fast'
            const inner = (
              <>
                <span className="time-value">{formatShowTime(show.time)}</span>
                <span className="time-format">{show.format} · {formatCurrency(show.price)}</span>
                <span className="time-seats">{bookable ? `${show.availableSeats} seats left` : STATUS_TEXT[show.status]}</span>
              </>
            )
            return (
              <li key={show.id}>
                {bookable ? (
                  <Link
                    to={bookingUrl({ movie: state.movie, theatre: state.theatre, date, show: show.id })}
                    className={`time-slot is-${show.status}`}
                    aria-label={`${formatShowTime(show.time)}, ${show.screenName}, ${show.format}, ${show.availableSeats} seats left`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <span className={`time-slot is-${show.status}`} aria-label={`${formatShowTime(show.time)}, ${STATUS_TEXT[show.status]}`}>
                    {inner}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
