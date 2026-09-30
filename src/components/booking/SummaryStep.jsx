import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StepError from './StepError'
import { PosterImage } from '../movies/MovieCard'
import useAsync from '../../hooks/useAsync'
import { useAuth } from '../../context/AuthContext'
import { createBooking, findMyBookingsForShow } from '../../services/bookingApi'
import { getShowSeats } from '../../services/theatreApi'
import { languageName } from '../../services/tmdb'
import { urlForStep } from '../../utils/bookingFlow'
import { formatCurrency, formatShowTime } from '../../utils/format'
import { BOOKING_FEE_PER_TICKET, priceBreakdown } from '../../utils/pricing'

// One request id per (show, seats) choice, kept for the browser session. Re-submitting the
// same choice — double click, refresh, back button — reuses it, so the server returns the
// booking already made instead of creating a duplicate.
function requestIdFor(showId, seats) {
  const key = `mtb_booking_request:${showId}:${[...seats].sort().join(',')}`
  try {
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export default function SummaryStep({ state }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const seatData = useAsync((signal) => getShowSeats(state.show, { signal }), state.show)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const inFlight = useRef(false)

  const backToSeats = (
    <Link to={urlForStep(state, 'seats')} className="btn btn-outline">
      Change seats
    </Link>
  )

  if (seatData.status === 'loading') {
    return (
      <div className="summary-card skeleton" aria-busy="true" aria-label="Loading booking summary">
        <div className="shimmer line w-50 tall" />
        <div className="shimmer line w-80" />
        <div className="shimmer line w-70" />
        <div className="shimmer line w-90" />
      </div>
    )
  }
  if (seatData.status === 'error') {
    return <StepError error={seatData.error} onRetry={seatData.reload} back={backToSeats} />
  }

  const { show, theatre, screen, movie, seatMap } = seatData.data
  const seatsById = new Map(seatMap.rows.flatMap((r) => r.blocks.flat()).map((s) => [s.id, s]))
  const chosen = state.seats.map((id) => seatsById.get(id)).filter(Boolean)
  const unknown = state.seats.filter((id) => !seatsById.has(id))
  const taken = chosen.filter((s) => s.status === 'booked').map((s) => s.id)

  if (show.status === 'past') {
    return (
      <StepError
        error={{ status: 410, message: 'This show has already started, so it can no longer be booked.' }}
        back={<Link to={urlForStep(state, 'show')} className="btn btn-primary">Choose another show</Link>}
      />
    )
  }
  // These exact seats are already in one of the user's own bookings: don't book twice.
  const mine = findMyBookingsForShow(user, show.id).find((b) => state.seats.every((id) => b.seats.includes(id)))
  if (mine) {
    return (
      <StepError
        error={{ status: 409, message: `You've already booked ${state.seats.join(', ')} for this show (booking ${mine.id}).` }}
        back={
          <>
            <Link to={`/bookings/${mine.id}`} className="btn btn-primary">View booking</Link>
            {backToSeats}
          </>
        }
      />
    )
  }
  if (unknown.length || taken.length) {
    const message = unknown.length
      ? `These seats don't exist for this show: ${unknown.join(', ')}.`
      : `${taken.join(', ')} ${taken.length === 1 ? 'is' : 'are'} no longer available. Please pick other seats.`
    return <StepError error={{ status: 409, message }} back={backToSeats} />
  }

  const { groups, tickets, fee, total } = priceBreakdown(chosen, seatMap.tiers)
  const existing = findMyBookingsForShow(user, show.id)
  const when = new Date(show.startsAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const confirm = async () => {
    if (inFlight.current) return // ignore double clicks before the button re-renders as disabled
    inFlight.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { booking, duplicate } = await createBooking({
        user,
        showId: show.id,
        seatIds: state.seats,
        requestId: requestIdFor(show.id, state.seats),
      })
      // Replace, so Back from the confirmation doesn't land on a stale summary.
      navigate(`/bookings/${booking.id}`, { replace: true, state: { justBooked: !duplicate, duplicate } })
    } catch (err) {
      setSubmitError(err)
      inFlight.current = false
      setSubmitting(false)
      if (err.status === 409) seatData.reload() // refresh the seat map to show what was taken
    }
  }

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

          {submitError && (
            <p className="summary-error" role="alert">
              {submitError.message}
            </p>
          )}

          <div className="summary-actions">
            {backToSeats}
            <button type="button" className="btn btn-primary" onClick={confirm} disabled={submitting}>
              {submitting ? 'Confirming…' : `Confirm booking · ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
