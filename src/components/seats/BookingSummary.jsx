import { PosterImage } from '../movies/MovieCard'
import { formatCurrency, formatShowTime } from '../../utils/format'
import { languageName } from '../../services/tmdb'
import { BOOKING_FEE_PER_TICKET, priceBreakdown } from '../../utils/pricing'
import { tierColorMap } from '../../utils/seatTheme'

export default function BookingSummary({ data, selectedSeats, maxSeats, onClear, onProceed }) {
  const { show, theatre, screen, movie, seatMap } = data
  const { groups, tickets, fee, total } = priceBreakdown(selectedSeats, seatMap.tiers)
  const colorOf = tierColorMap(seatMap.tiers)
  const date = new Date(show.startsAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  const count = selectedSeats.length

  return (
    <aside className="booking-summary" aria-labelledby="summary-title">
      <div className="summary-movie">
        <div className="summary-poster">
          <PosterImage path={movie.poster_path} fallback={movie.poster_fallback} title={movie.title} size="w185" />
        </div>
        <div className="summary-movie-info">
          <h2 id="summary-title">{movie.title}</h2>
          <p>{languageName(movie.original_language)} · {screen.type}</p>
          <p>{theatre.name}</p>
          <p className="summary-when">
            {date} · {formatShowTime(show.time)} · {screen.name}
          </p>
        </div>
      </div>

      <div className="summary-count" aria-live="polite">
        <span>
          <strong>{count}</strong> of {maxSeats} seats selected
        </span>
        {count > 0 && (
          <button type="button" className="link-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <div className="count-meter" aria-hidden="true">
        <span style={{ width: `${(count / maxSeats) * 100}%` }} />
      </div>

      {count === 0 ? (
        <p className="summary-empty">Tap on available seats to select them. You can book up to {maxSeats} seats.</p>
      ) : (
        <>
          <ul className="summary-groups">
            {groups.map((g) => (
              <li key={g.tier} style={{ '--tier': colorOf[g.tier] }}>
                <div className="summary-line">
                  <span>
                    <span className="tier-dot" aria-hidden="true" />
                    {g.tier} <span className="muted">× {g.seats.length} @ {formatCurrency(g.price)}</span>
                  </span>
                  <span>{formatCurrency(g.subtotal)}</span>
                </div>
                <ul className="summary-seats" aria-label={`${g.tier} seats`}>
                  {g.seats.map((s) => (
                    <li key={s.id}>{s.id}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <dl className="summary-totals">
            <div>
              <dt>Tickets</dt>
              <dd>{formatCurrency(tickets)}</dd>
            </div>
            <div>
              <dt>Booking fee <span className="muted">({formatCurrency(BOOKING_FEE_PER_TICKET)} × {count})</span></dt>
              <dd>{formatCurrency(fee)}</dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>
        </>
      )}

      <button type="button" className="btn btn-primary btn-block" disabled={count === 0} onClick={onProceed}>
        {count === 0 ? 'Select seats to continue' : `Proceed · ${formatCurrency(total)}`}
      </button>
    </aside>
  )
}
