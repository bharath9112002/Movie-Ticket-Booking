import { Link } from 'react-router-dom'
import { PosterImage } from '../movies/MovieCard'
import { languageName } from '../../services/tmdb'
import { formatCurrency, formatShowTime } from '../../utils/format'
import { BOOKING_FEE_PER_TICKET } from '../../utils/pricing'

// Compact booking summary shown beside the payment form.
export default function OrderSummary({ checkout, editUrl }) {
  const { show, theatre, screen, movie, chosen, price } = checkout
  const when = new Date(show.startsAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <aside className="order-summary" aria-labelledby="order-title">
      <div className="order-head">
        <h2 id="order-title">Booking summary</h2>
        <Link to={editUrl} className="selection-change">Edit</Link>
      </div>

      <div className="summary-movie">
        <div className="summary-poster">
          <PosterImage path={movie.poster_path} fallback={movie.poster_fallback} title={movie.title} size="w185" />
        </div>
        <div className="summary-movie-info">
          <h3>{movie.title}</h3>
          <p>
            {languageName(movie.original_language)} · {screen.type}
          </p>
          <p>{theatre.name}</p>
          <p className="summary-when">
            {when} · {formatShowTime(show.time)} · {screen.name}
          </p>
        </div>
      </div>

      <ul className="summary-groups">
        {price.groups.map((g) => (
          <li key={g.tier}>
            <div className="summary-line">
              <span>
                {g.tier} <span className="muted">× {g.seats.length}</span>
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
          <dd>{formatCurrency(price.tickets)}</dd>
        </div>
        <div>
          <dt>
            Booking fee <span className="muted">({formatCurrency(BOOKING_FEE_PER_TICKET)} × {chosen.length})</span>
          </dt>
          <dd>{formatCurrency(price.fee)}</dd>
        </div>
        <div className="summary-total">
          <dt>Amount payable</dt>
          <dd>{formatCurrency(price.total)}</dd>
        </div>
      </dl>
    </aside>
  )
}
