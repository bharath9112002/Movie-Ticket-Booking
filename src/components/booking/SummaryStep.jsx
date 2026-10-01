import { Link } from 'react-router-dom'
import CheckoutGuard from './CheckoutGuard'
import { PosterImage } from '../movies/MovieCard'
import { languageName } from '../../services/tmdb'
import { urlForStep } from '../../utils/bookingFlow'
import { formatCurrency, formatShowTime } from '../../utils/format'
import { BOOKING_FEE_PER_TICKET } from '../../utils/pricing'

export default function SummaryStep({ state }) {
  return (
    <CheckoutGuard state={state}>
      {({ show, theatre, screen, movie, chosen, price, existing }) => {
        const { groups, tickets, fee, total } = price
        const when = new Date(show.startsAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

        return (
          <section className="summary-card" aria-labelledby="step-title">
            <h2 id="step-title" className="summary-heading">Review your booking</h2>

            <div className="summary-grid">
              <div className="summary-show">
                <div className="summary-show-poster">
                  <PosterImage path={movie.poster_path} fallback={movie.poster_fallback} title={movie.title} size="w342" />
                </div>
                <div>
                  <h3>{movie.title}</h3>
                  <p className="pick-meta">
                    {languageName(movie.original_language)} · {screen.type}
                  </p>
                  <dl className="summary-facts">
                    <div>
                      <dt>Theatre</dt>
                      <dd>{theatre.name}</dd>
                    </div>
                    <div>
                      <dt>Address</dt>
                      <dd>{theatre.address}</dd>
                    </div>
                    <div>
                      <dt>Date &amp; time</dt>
                      <dd>
                        {when}, {formatShowTime(show.time)}
                      </dd>
                    </div>
                    <div>
                      <dt>Screen</dt>
                      <dd>
                        {screen.name} ({screen.type})
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="summary-price">
                <h3>Tickets</h3>
                <ul className="summary-groups">
                  {groups.map((g) => (
                    <li key={g.tier}>
                      <div className="summary-line">
                        <span>
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
                    <dt>Ticket price</dt>
                    <dd>{formatCurrency(tickets)}</dd>
                  </div>
                  <div>
                    <dt>
                      Booking fee <span className="muted">({formatCurrency(BOOKING_FEE_PER_TICKET)} × {chosen.length})</span>
                    </dt>
                    <dd>{formatCurrency(fee)}</dd>
                  </div>
                  <div className="summary-total">
                    <dt>Total payable</dt>
                    <dd>{formatCurrency(total)}</dd>
                  </div>
                </dl>

                {existing.length > 0 && (
                  <p className="summary-note" role="note">
                    You already have {existing.length === 1 ? 'a booking' : `${existing.length} bookings`} for this show (
                    {existing.map((b) => (
                      <Link key={b.id} to={`/bookings/${b.id}`}>
                        {b.id}: {b.seats.join(', ')}
                      </Link>
                    )).reduce((acc, el, i) => (i ? [...acc, '; ', el] : [el]), [])}
                    ). This will be a separate booking.
                  </p>
                )}

                <div className="summary-actions">
                  <Link to={urlForStep(state, 'seats')} className="btn btn-outline">
                    Change seats
                  </Link>
                  <Link to={urlForStep(state, 'payment')} className="btn btn-primary">
                    Proceed to pay · {formatCurrency(total)}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )
      }}
    </CheckoutGuard>
  )
}
