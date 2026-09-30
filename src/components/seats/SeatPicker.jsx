import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SeatMap from './SeatMap'
import BookingSummary from './BookingSummary'
import { MAX_SEATS_PER_BOOKING } from '../../services/theatreApi'
import { formatCurrency } from '../../utils/format'
import { priceBreakdown } from '../../utils/pricing'
import { tierColor } from '../../utils/seatTheme'

const NOTICE_MS = 3000

// Interactive seat map + summary. `initialSelected` restores a previous pick (still-free seats only);
// `onProceed` receives the chosen seat ids in row/number order.
export default function SeatPicker({ data, initialSelected = [], onProceed }) {
  const [selectedIds, setSelectedIds] = useState(() => {
    const free = new Set(data.seatMap.rows.flatMap((r) => r.blocks.flat()).filter((s) => s.status === 'available').map((s) => s.id))
    return new Set(initialSelected.filter((id) => free.has(id)).slice(0, MAX_SEATS_PER_BOOKING))
  })
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef()

  const seatsById = useMemo(
    () => new Map(data.seatMap.rows.flatMap((row) => row.blocks.flat()).map((seat) => [seat.id, seat])),
    [data],
  )
  const selectedSeats = [...selectedIds].map((id) => seatsById.get(id))
  const availableCount = [...seatsById.values()].filter((s) => s.status === 'available').length

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const flash = (message) => {
    setNotice(message)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(''), NOTICE_MS)
  }

  const toggle = (seat) => {
    if (seat.status === 'booked') return
    if (selectedIds.has(seat.id)) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(seat.id)
        return next
      })
      return
    }
    if (selectedIds.size >= MAX_SEATS_PER_BOOKING) {
      flash(`You can book a maximum of ${MAX_SEATS_PER_BOOKING} seats at a time.`)
      return
    }
    setSelectedIds((prev) => new Set(prev).add(seat.id))
  }

  const proceed = () => {
    if (!selectedSeats.length) return
    const { groups } = priceBreakdown(selectedSeats, data.seatMap.tiers)
    onProceed(groups.flatMap((g) => g.seats.map((s) => s.id)))
  }

  const count = selectedSeats.length
  const { total } = priceBreakdown(selectedSeats, data.seatMap.tiers)
  const soldOut = availableCount === 0

  return (
    <div className="seat-layout">
      <section className="seat-panel" aria-labelledby="seat-panel-title">
        <header className="seat-panel-head">
          <div>
            <h2 id="seat-panel-title">Select your seats</h2>
            <p>
              {availableCount} of {data.show.totalSeats} seats available · max {MAX_SEATS_PER_BOOKING} per booking
            </p>
          </div>
          <ul className="seat-legend" aria-label="Legend">
            <li><span className="legend-seat is-available" aria-hidden="true" /> Available</li>
            <li><span className="legend-seat is-selected" aria-hidden="true" /> Selected</li>
            <li><span className="legend-seat is-booked" aria-hidden="true" /> Booked</li>
          </ul>
        </header>

        {soldOut && (
          <p className="seat-alert" role="status">
            This show is sold out. <Link to={`/theatres/${data.theatre.id}`}>Pick another show time</Link>.
          </p>
        )}

        <SeatMap
          rows={data.seatMap.rows}
          tiers={data.seatMap.tiers}
          selectedIds={selectedIds}
          onToggle={toggle}
        />

        <ul className="tier-prices" aria-label="Seat prices">
          {data.seatMap.tiers.map((t, i) => (
            <li key={t.name} style={{ '--tier': tierColor(i) }}>
              <span className="tier-dot" aria-hidden="true" />
              {t.name} <strong>{formatCurrency(t.price)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <BookingSummary
        data={data}
        selectedSeats={selectedSeats}
        maxSeats={MAX_SEATS_PER_BOOKING}
        onClear={() => setSelectedIds(new Set())}
        onProceed={proceed}
      />

      {/* Sticky bar for narrower screens, where the summary sits below the full-width map. */}
      <div className={`mobile-bar${count ? ' is-visible' : ''}`}>
        <div className="mobile-bar-info">
          <strong>
            {count} seat{count === 1 ? '' : 's'} · {formatCurrency(total)}
          </strong>
          <span className="mobile-bar-seats">{selectedSeats.map((seat) => seat.id).join(', ')}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={proceed} disabled={!count}>
          Proceed · {formatCurrency(total)}
        </button>
      </div>

      <div className={`toast${notice ? ' is-visible' : ''}`} role="alert" aria-live="assertive">
        {notice}
      </div>
    </div>
  )
}
