import { Link } from 'react-router-dom'
import StepError from './StepError'
import useAsync from '../../hooks/useAsync'
import { useAuth } from '../../context/AuthContext'
import { findMyBookingsForShow } from '../../services/bookingApi'
import { getShowSeats } from '../../services/theatreApi'
import { urlForStep } from '../../utils/bookingFlow'
import { priceBreakdown } from '../../utils/pricing'

/**
 * Loads the chosen show and seats and checks they can still be booked (show not started,
 * seats exist and are free, not already booked by this user). Renders the matching error
 * or `children({ show, theatre, screen, movie, chosen, price, existing })`.
 * Shared by the summary and payment steps.
 */
export default function CheckoutGuard({ state, children }) {
  const { user } = useAuth()
  const seatData = useAsync((signal) => getShowSeats(state.show, { signal }), state.show)

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

  return children({
    show,
    theatre,
    screen,
    movie,
    chosen,
    price: priceBreakdown(chosen, seatMap.tiers),
    existing: findMyBookingsForShow(user, show.id),
  })
}
