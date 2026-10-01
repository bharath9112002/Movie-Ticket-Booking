import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import DownloadTicketButton from '../booking/DownloadTicketButton'
import { formatCurrency, formatDateTime, formatShowTime } from '../../utils/format'

// Move focus to the result heading so screen readers announce the outcome.
function useFocusOnMount() {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return ref
}

function Facts({ items }) {
  return (
    <dl className="result-facts">
      {items.filter(Boolean).map(([label, value, mono]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className={mono ? 'is-mono' : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function PaymentSuccess({ booking, receipt }) {
  const heading = useFocusOnMount()
  const start = new Date(booking.startsAt)

  return (
    <section className="pay-result is-success" aria-labelledby="pay-result-title">
      <span className="result-icon" aria-hidden="true">✓</span>
      <h2 id="pay-result-title" ref={heading} tabIndex={-1}>
        Payment successful
      </h2>
      <p className="result-lead">
        {formatCurrency(receipt.amount)} paid. Your tickets for <strong>{booking.movie.title}</strong> are confirmed.
      </p>

      <Facts
        items={[
          ['Booking ID', booking.id, true],
          ['Transaction ID', receipt.transactionId, true],
          ['Paid via', receipt.label],
          ['Paid on', formatDateTime(new Date(receipt.paidAt))],
          ['Show', `${start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatShowTime(booking.showTime)}`],
          ['Seats', booking.seats.join(', ')],
          ['Theatre', `${booking.theatre.name} · ${booking.screen.name}`],
        ]}
      />

      <p className="result-note">A confirmation has been sent to {booking.userEmail}.</p>

      <div className="result-actions">
        <DownloadTicketButton bookingId={booking.id} />
        <Link to={`/bookings/${booking.id}`} className="btn btn-outline">View ticket</Link>
        <Link to="/bookings" className="btn btn-outline">My bookings</Link>
      </div>
    </section>
  )
}

export function PaymentFailure({ failure, onRetry, onChangeMethod, summaryUrl, seatsUrl }) {
  const heading = useFocusOnMount()

  return (
    <section className="pay-result is-failure" aria-labelledby="pay-result-title">
      <span className="result-icon" aria-hidden="true">✕</span>
      <h2 id="pay-result-title" ref={heading} tabIndex={-1}>
        {failure.charged ? 'Booking could not be completed' : 'Payment failed'}
      </h2>
      <p className="result-lead" role="alert">
        {failure.reason}
      </p>

      <Facts
        items={[
          ['Amount', formatCurrency(failure.amount)],
          ['Method', failure.label],
          failure.transactionId && ['Reference', failure.transactionId, true],
        ]}
      />

      <p className="result-note">
        {failure.charged
          ? 'The amount debited will be refunded to your original payment method within 5–7 working days.'
          : 'No money was deducted. If your account was debited, it will be refunded automatically within 5–7 working days.'}
      </p>

      <div className="result-actions">
        {failure.seatsTaken ? (
          <Link to={seatsUrl} className="btn btn-primary">Choose other seats</Link>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Retry payment
            </button>
            <button type="button" className="btn btn-outline" onClick={onChangeMethod}>
              Use another method
            </button>
          </>
        )}
        <Link to={summaryUrl} className="btn btn-outline">Back to summary</Link>
      </div>
    </section>
  )
}
