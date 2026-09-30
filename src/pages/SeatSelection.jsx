import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatusMessage from '../components/common/StatusMessage'
import SeatMap from '../components/seats/SeatMap'
import BookingSummary from '../components/seats/BookingSummary'
import { MAX_SEATS_PER_BOOKING, getShowSeats } from '../services/theatreApi'
import { formatCurrency, formatShowTime } from '../utils/format'
import { priceBreakdown } from '../utils/pricing'
import '../styles/listing.css'
import './SeatSelection.css'

const NOTICE_MS = 3000

function SeatPicker({ data }) {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState(() => new Set())
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
    const { total } = priceBreakdown(selectedSeats, data.seatMap.tiers)
    // Payment is the next module; hand the selection over for it to pick up.
    navigate('/bookings', {
      state: { showId: data.show.id, seats: selectedSeats.map((s) => s.id), total },
    })
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
            <li><span className="seat is-available" aria-hidden="true" /> Available</li>
            <li><span className="seat is-selected" aria-hidden="true" /> Selected</li>
            <li><span className="seat is-booked" aria-hidden="true" /> Booked</li>
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
          {data.seatMap.tiers.map((t) => (
            <li key={t.name}>
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

      {/* Compact bar for small screens, where the summary sits below the map. */}
      <div className={`mobile-bar${count ? ' is-visible' : ''}`}>
        <div>
          <strong>{count} seat{count === 1 ? '' : 's'}</strong>
          <span>{formatCurrency(total)}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={proceed}>
          Proceed
        </button>
      </div>

      <div className={`toast${notice ? ' is-visible' : ''}`} role="alert" aria-live="assertive">
        {notice}
      </div>
    </div>
  )
}

export default function SeatSelection() {
  const { showId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${showId}|${reloadKey}`
  const [response, setResponse] = useState({ key: null })
  const state = response.key === requestKey ? response : { status: 'loading' }

  useEffect(() => {
    const controller = new AbortController()
    getShowSeats(showId, { signal: controller.signal })
      .then((data) => setResponse({ key: requestKey, status: 'success', data }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResponse({ key: requestKey, status: 'error', error })
      })
    return () => controller.abort()
  }, [showId, requestKey])

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/theatres'))

  let content
  if (state.status === 'loading') {
    content = (
      <div className="seat-layout" aria-busy="true" aria-label="Loading seat layout">
        <div className="seat-panel skeleton">
          <div className="shimmer line w-40" />
          <div className="seat-skeleton-grid">
            {Array.from({ length: 96 }, (_, i) => (
              <span key={i} className="shimmer" />
            ))}
          </div>
        </div>
        <div className="booking-summary skeleton">
          <div className="shimmer line w-70" />
          <div className="shimmer line w-50" />
          <div className="shimmer line w-90" />
        </div>
      </div>
    )
  } else if (state.status === 'error') {
    const notFound = state.error.status === 404
    content = (
      <StatusMessage
        icon={notFound ? '🎟️' : '⚠️'}
        title={notFound ? 'Show not found' : "Couldn't load seats"}
        message={state.error.message}
        action={
          <div className="status-actions">
            {!notFound && (
              <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            )}
            <Link to="/theatres" className="btn btn-outline">Browse theatres</Link>
          </div>
        }
      />
    )
  } else if (state.data.show.status === 'past') {
    content = (
      <StatusMessage
        icon="⏰"
        title="This show has already started"
        message="Booking closes when the show begins. Choose another show time."
        action={
          <Link to={`/theatres/${state.data.theatre.id}`} className="btn btn-primary">
            See other shows
          </Link>
        }
      />
    )
  } else {
    content = <SeatPicker key={showId} data={state.data} />
  }

  const info = state.status === 'success' ? state.data : null

  return (
    <>
      <Navbar />
      <main className="seat-page">
        <header className="seat-header">
          <button type="button" className="back-link" onClick={goBack}>
            ← Back
          </button>
          {info ? (
            <>
              <h1>{info.movie.title}</h1>
              <p>
                {info.theatre.name} · {info.screen.name} ({info.screen.type}) ·{' '}
                {new Date(info.show.startsAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })},{' '}
                {formatShowTime(info.show.time)}
              </p>
            </>
          ) : (
            <h1>Seat selection</h1>
          )}
        </header>
        {content}
      </main>
    </>
  )
}
