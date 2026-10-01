import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { cancelBooking } from '../../services/bookingApi'
import { REFUND_POLICY, refundQuote } from '../../utils/bookingStatus'
import { formatCurrency, formatShowTime } from '../../utils/format'

const REASONS = ['Change of plans', 'Booked the wrong show or seats', 'Found a better show time', 'Other']

// Confirmation dialog for cancelling a booking; shows the refund before the user commits.
export default function CancelBookingDialog({ booking, onClose, onCancelled }) {
  const { user } = useAuth()
  const dialog = useRef(null)
  const controller = useRef(null)
  const [quote] = useState(() => refundQuote(booking, Date.now()))
  const [reason, setReason] = useState(REASONS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const el = dialog.current
    el.showModal()
    return () => {
      controller.current?.abort()
      if (el.open) el.close()
    }
  }, [])

  const close = () => {
    if (!submitting) onClose()
  }

  const confirm = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    controller.current = new AbortController()
    try {
      const updated = await cancelBooking({ bookingId: booking.id, user, reason }, { signal: controller.current.signal })
      onCancelled(updated)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message)
      setSubmitting(false)
    }
  }

  const start = new Date(booking.startsAt)

  return (
    <dialog
      ref={dialog}
      className="cancel-dialog"
      aria-labelledby="cancel-title"
      onCancel={(e) => {
        e.preventDefault() // Escape: close through React state instead
        close()
      }}
      onClick={(e) => e.target === dialog.current && close()} // backdrop click
    >
      <form onSubmit={confirm} className="cancel-body">
        <header className="cancel-head">
          <h2 id="cancel-title">Cancel booking?</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close" disabled={submitting}>
            ✕
          </button>
        </header>

        <p className="cancel-show">
          <strong>{booking.movie.title}</strong>
          <br />
          {booking.theatre.name} · {start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })},{' '}
          {formatShowTime(booking.showTime)} · Seats {booking.seats.join(', ')}
        </p>

        {quote.allowed ? (
          <>
            <dl className="refund-table">
              <div>
                <dt>Ticket price</dt>
                <dd>{formatCurrency(quote.tickets)}</dd>
              </div>
              <div>
                <dt>Refundable ({quote.percent}%)</dt>
                <dd>{formatCurrency(quote.refund)}</dd>
              </div>
              <div>
                <dt>Booking fee (non-refundable)</dt>
                <dd>{formatCurrency(quote.fee)}</dd>
              </div>
              <div className="refund-total">
                <dt>You&rsquo;ll get back</dt>
                <dd>{formatCurrency(quote.refund)}</dd>
              </div>
            </dl>
            <p className="cancel-policy">
              Refund policy:{' '}
              {REFUND_POLICY.map((p) => `${p.percent}% if cancelled ${p.label}`).join('; ')}. Refunds go back to{' '}
              {booking.payment?.label ?? 'your original payment method'} in 5–7 working days.
            </p>

            <fieldset className="cancel-reasons" disabled={submitting}>
              <legend>Reason for cancelling</legend>
              {REASONS.map((r) => (
                <label key={r} className="checkbox">
                  <input type="radio" name="cancel-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </fieldset>
          </>
        ) : (
          <p className="summary-error" role="alert">
            {quote.reason}
          </p>
        )}

        {error && (
          <p className="summary-error" role="alert">
            {error}
          </p>
        )}

        <div className="cancel-actions">
          <button type="button" className="btn btn-outline" onClick={close} disabled={submitting}>
            Keep booking
          </button>
          {quote.allowed && (
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner is-small" aria-hidden="true" /> Cancelling…
                </>
              ) : (
                `Cancel & refund ${formatCurrency(quote.refund)}`
              )}
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}
