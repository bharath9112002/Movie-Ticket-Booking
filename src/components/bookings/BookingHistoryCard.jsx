import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { PosterImage } from '../movies/MovieCard'
import { languageName } from '../../services/tmdb'
import { formatCurrency, formatDateTime, formatShowTime } from '../../utils/format'

function TicketDetails({ booking: b, id }) {
  const c = b.cancellation
  return (
    <div className="history-details" id={id}>
      <div>
        <h3>Tickets</h3>
        <dl className="detail-list">
          {b.lines.map((l) => (
            <div key={l.tier}>
              <dt>
                {l.tier} × {l.count} <span className="muted">@ {formatCurrency(l.price)}</span>
              </dt>
              <dd>{formatCurrency(l.subtotal)}</dd>
            </div>
          ))}
          <div>
            <dt>Booking fee</dt>
            <dd>{formatCurrency(b.fee)}</dd>
          </div>
          <div className="detail-total">
            <dt>Total paid</dt>
            <dd>{formatCurrency(b.total)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3>Booking</h3>
        <dl className="detail-list">
          <div>
            <dt>Booking ID</dt>
            <dd className="is-mono">{b.id}</dd>
          </div>
          <div>
            <dt>Booked on</dt>
            <dd>{formatDateTime(new Date(b.createdAt))}</dd>
          </div>
          <div>
            <dt>Paid via</dt>
            <dd>{b.payment?.label ?? '—'}</dd>
          </div>
          {b.payment && (
            <div>
              <dt>Transaction</dt>
              <dd className="is-mono">{b.payment.transactionId}</dd>
            </div>
          )}
          <div>
            <dt>Language · format</dt>
            <dd>
              {languageName(b.movie.language)} · {b.format}
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{b.theatre.address}</dd>
          </div>
        </dl>
      </div>

      {c && (
        <div className="history-refund">
          <h3>Cancellation</h3>
          <dl className="detail-list">
            <div>
              <dt>Cancelled on</dt>
              <dd>{formatDateTime(new Date(c.cancelledAt))}</dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{c.reason}</dd>
            </div>
            <div className="detail-total">
              <dt>Refund ({c.refundPercent}% of tickets)</dt>
              <dd>{formatCurrency(c.refund)}</dd>
            </div>
          </dl>
          <p className="muted">Refund initiated to {b.payment?.label ?? 'your original payment method'}. It takes 5–7 working days.</p>
        </div>
      )}
    </div>
  )
}

export default function BookingHistoryCard({ booking: b, status, canCancel, onCancel }) {
  const [open, setOpen] = useState(false)
  const start = new Date(b.startsAt)
  const detailsId = `details-${b.id}`

  return (
    <li className={`history-card is-${status}`}>
      <div className="history-main">
        <div className="booking-row-poster">
          <PosterImage path={b.movie.poster_path} title={b.movie.title} size="w185" />
        </div>
        <div className="booking-row-info">
          <div className="history-title">
            <h2 className="pick-title">{b.movie.title}</h2>
            <StatusBadge status={status} />
          </div>
          <p className="pick-meta">{b.theatre.name}</p>
          <p className="pick-meta">
            {start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })},{' '}
            {formatShowTime(b.showTime)} · {b.screen.name} · Seats {b.seats.join(', ')}
          </p>
        </div>
        <div className="booking-row-side">
          <span className="booking-row-id">{b.id}</span>
          <span className="booking-row-total">{formatCurrency(b.total)}</span>
          <span className="history-booked">Booked {formatDateTime(new Date(b.createdAt))}</span>
        </div>
      </div>

      <div className="history-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide details ▴' : 'Ticket details ▾'}
        </button>
        <Link to={`/bookings/${b.id}`} className="btn btn-outline btn-sm">
          🎟️ View e-ticket
        </Link>
        {canCancel && (
          <button type="button" className="btn btn-sm btn-danger-outline" onClick={() => onCancel(b)}>
            Cancel booking
          </button>
        )}
      </div>

      {open && <TicketDetails booking={b} id={detailsId} />}
    </li>
  )
}
