import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Barcode from '../components/booking/Barcode'
import StepError from '../components/booking/StepError'
import DownloadTicketButton from '../components/booking/DownloadTicketButton'
import CancelBookingDialog from '../components/bookings/CancelBookingDialog'
import { PosterImage } from '../components/movies/MovieCard'
import { useAuth } from '../context/AuthContext'
import useAsync from '../hooks/useAsync'
import { getBooking } from '../services/bookingApi'
import { languageName } from '../services/tmdb'
import { bookingStatus, refundQuote } from '../utils/bookingStatus'
import { formatCurrency, formatDateTime, formatShowTime } from '../utils/format'
import '../styles/listing.css'
import './Movies.css'
import './Booking.css'
import './BookingHistory.css'

export default function BookingConfirmation() {
  const { bookingId } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const booking = useAsync((signal) => getBooking(bookingId, user, { signal }), `${bookingId}|${user.id}`)
  const { justBooked, duplicate } = location.state ?? {}
  const [now] = useState(() => Date.now())
  const [cancelled, setCancelled] = useState(null) // the booking after cancelling it here
  const [cancelling, setCancelling] = useState(false)

  let content
  if (booking.status === 'loading') {
    content = (
      <div className="ticket skeleton" aria-busy="true" aria-label="Loading booking">
        <div className="shimmer line w-50 tall" />
        <div className="shimmer line w-80" />
        <div className="shimmer line w-70" />
      </div>
    )
  } else if (booking.status === 'error') {
    content = (
      <StepError
        error={booking.error}
        onRetry={booking.reload}
        back={<Link to="/bookings" className="btn btn-outline">My bookings</Link>}
      />
    )
  } else {
    const b = cancelled ?? booking.data
    const start = new Date(b.startsAt)
    const status = bookingStatus(b, now)
    const canCancel = refundQuote(b, now).allowed
    const pill = {
      upcoming: ['is-upcoming', 'Confirmed · Upcoming'],
      completed: ['is-past', 'Confirmed · Completed'],
      cancelled: ['is-cancelled', 'Cancelled'],
    }[status]

    content = (
      <>
        {status === 'cancelled' && (
          <div className="confirm-banner is-cancelled" role="status">
            <span className="confirm-check" aria-hidden="true">✕</span>
            <div>
              <h1>Booking cancelled</h1>
              <p>
                Cancelled {formatDateTime(new Date(b.cancellation.cancelledAt))}. Refund of{' '}
                <strong>{formatCurrency(b.cancellation.refund)}</strong> to {b.payment?.label ?? 'your original payment method'}{' '}
                in 5–7 working days.
              </p>
            </div>
          </div>
        )}
        {status !== 'cancelled' && justBooked && (
          <div className="confirm-banner" role="status">
            <span className="confirm-check" aria-hidden="true">✓</span>
            <div>
              <h1>Booking confirmed!</h1>
              <p>
                Your tickets are booked. Show booking ID <strong>{b.id}</strong> at the theatre.
              </p>
            </div>
          </div>
        )}
        {status !== 'cancelled' && duplicate && (
          <div className="confirm-banner is-info" role="status">
            <span className="confirm-check" aria-hidden="true">i</span>
            <div>
              <h1>Already booked</h1>
              <p>This booking was already confirmed, so we didn&apos;t create a duplicate.</p>
            </div>
          </div>
        )}
        {status !== 'cancelled' && !justBooked && !duplicate && <h1 className="ticket-page-title">Your ticket</h1>}

        <article className={`ticket${status === 'cancelled' ? ' is-cancelled' : ''}`} aria-label={`Ticket ${b.id}`}>
          {status === 'cancelled' && (
            <span className="ticket-void" aria-hidden="true">
              Cancelled
            </span>
          )}
          <div className="ticket-main">
            <div className="ticket-poster">
              <PosterImage path={b.movie.poster_path} title={b.movie.title} size="w342" />
            </div>
            <div className="ticket-info">
              <span className={`status-pill ${pill[0]}`}>{pill[1]}</span>
              <h2>{b.movie.title}</h2>
              <p className="pick-meta">
                {languageName(b.movie.language)} · {b.format}
              </p>
              <dl className="ticket-facts">
                <div>
                  <dt>Date</dt>
                  <dd>{start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{formatShowTime(b.showTime)}</dd>
                </div>
                <div>
                  <dt>Screen</dt>
                  <dd>{b.screen.name}</dd>
                </div>
                <div>
                  <dt>Seats ({b.seats.length})</dt>
                  <dd>{b.seats.join(', ')}</dd>
                </div>
              </dl>
              <p className="ticket-theatre">
                <strong>{b.theatre.name}</strong>
                <br />
                {b.theatre.address}
              </p>
            </div>
          </div>

          <div className="ticket-stub">
            <p className="stub-label">Booking ID</p>
            <p className="stub-id">{b.id}</p>
            <Barcode value={b.id} />
            <dl className="stub-price">
              {b.lines.map((l) => (
                <div key={l.tier}>
                  <dt>
                    {l.tier} × {l.count}
                  </dt>
                  <dd>{formatCurrency(l.subtotal)}</dd>
                </div>
              ))}
              <div>
                <dt>Booking fee</dt>
                <dd>{formatCurrency(b.fee)}</dd>
              </div>
              <div className="stub-total">
                <dt>Total</dt>
                <dd>{formatCurrency(b.total)}</dd>
              </div>
            </dl>
            {b.payment && (
              <p className="stub-booked">
                Paid via {b.payment.label}
                <br />
                Txn {b.payment.transactionId}
              </p>
            )}
            <p className="stub-booked">
              Booked {new Date(b.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </article>

        <div className="ticket-actions no-print">
          {status !== 'cancelled' && (
            <>
              <DownloadTicketButton bookingId={b.id} />
              <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                🖨️ Print ticket
              </button>
            </>
          )}
          <Link to="/bookings" className="btn btn-outline">My bookings</Link>
          <Link to="/book" className="btn btn-outline">Book another</Link>
          {canCancel && (
            <button type="button" className="btn btn-danger-outline" onClick={() => setCancelling(true)}>
              Cancel booking
            </button>
          )}
        </div>
        {cancelling && (
          <CancelBookingDialog
            booking={b}
            onClose={() => setCancelling(false)}
            onCancelled={(updated) => {
              setCancelled(updated)
              setCancelling(false)
            }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="booking-page confirmation-page">{content}</main>
    </>
  )
}
