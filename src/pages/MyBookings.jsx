import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Pagination from '../components/common/Pagination'
import StatusMessage from '../components/common/StatusMessage'
import StepError from '../components/booking/StepError'
import BookingFilters from '../components/bookings/BookingFilters'
import BookingHistoryCard from '../components/bookings/BookingHistoryCard'
import CancelBookingDialog from '../components/bookings/CancelBookingDialog'
import { useAuth } from '../context/AuthContext'
import useAsync from '../hooks/useAsync'
import { getMyBookings } from '../services/bookingApi'
import { bookingStatus, filterBookings, refundQuote } from '../utils/bookingStatus'
import { formatCurrency } from '../utils/format'
import '../styles/listing.css'
import './Movies.css'
import './Booking.css'
import './BookingHistory.css'

const PAGE_SIZE = 8
const FILTER_PARAMS = ['q', 'movie', 'booked', 'from', 'to', 'status']

export default function MyBookings() {
  const { user } = useAuth()
  const bookings = useAsync((signal) => getMyBookings(user, { signal }), user.id)
  const [now] = useState(() => Date.now()) // when the page opened: splits upcoming/completed
  const [params, setParams] = useSearchParams()
  // Bookings changed on this page (cancelled), so the list updates without refetching.
  const [updated, setUpdated] = useState({})
  const [cancelling, setCancelling] = useState(null)
  const [notice, setNotice] = useState(null)

  const filters = useMemo(
    () => ({
      ...Object.fromEntries(FILTER_PARAMS.map((k) => [k, params.get(k) ?? ''])),
      page: Math.max(Number(params.get('page')) || 1, 1),
    }),
    [params],
  )

  // Any filter change goes back to page 1.
  const updateFilters = useCallback(
    (changes) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  const onCancelled = (booking) => {
    setUpdated((u) => ({ ...u, [booking.id]: booking }))
    setCancelling(null)
    setNotice(booking)
  }

  let content
  if (bookings.status === 'loading') {
    content = (
      <div className="booking-rows" aria-busy="true" aria-label="Loading bookings">
        {[0, 1, 2].map((i) => (
          <div key={i} className="booking-row skeleton">
            <div className="shimmer line w-70" />
          </div>
        ))}
      </div>
    )
  } else if (bookings.status === 'error') {
    content = <StepError error={bookings.error} onRetry={bookings.reload} />
  } else if (bookings.data.length === 0) {
    content = (
      <StatusMessage
        icon="🎟️"
        title="No bookings yet"
        message="When you book tickets they'll show up here."
        action={<Link to="/book" className="btn btn-primary">Book tickets</Link>}
      />
    )
  } else {
    const all = bookings.data.map((b) => updated[b.id] ?? b)
    const movies = [...new Map(all.map((b) => [String(b.movie.id), { id: String(b.movie.id), title: b.movie.title }])).values()].sort(
      (a, b) => a.title.localeCompare(b.title),
    )
    const matching = filterBookings(all, filters, now).map((b) => ({ booking: b, status: bookingStatus(b, now) }))
    const counts = matching.reduce((acc, { status }) => ({ ...acc, [status]: (acc[status] ?? 0) + 1 }), {})
    const shown = filters.status ? matching.filter((m) => m.status === filters.status) : matching
    const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
    const page = Math.min(filters.page, totalPages)
    const pageItems = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    content = (
      <>
        <BookingFilters
          filters={filters}
          movies={movies}
          counts={counts}
          onChange={updateFilters}
          onReset={() => setParams({}, { replace: true })}
        />

        <p className="result-count history-count" aria-live="polite">
          {shown.length === all.length
            ? `${all.length} booking${all.length === 1 ? '' : 's'}`
            : `${shown.length} of ${all.length} bookings`}
        </p>

        {shown.length === 0 ? (
          <StatusMessage
            icon="🔍"
            title="No bookings match"
            message="Try a different search, or clear the filters."
            action={
              <button type="button" className="btn btn-outline" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </button>
            }
          />
        ) : (
          <ul className="history-list">
            {pageItems.map(({ booking, status }) => (
              <BookingHistoryCard
                key={booking.id}
                booking={booking}
                status={status}
                canCancel={refundQuote(booking, now).allowed}
                onCancel={setCancelling}
              />
            ))}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => {
            updateFilters({ page: p > 1 ? String(p) : '' })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="booking-page">
        <header className="list-header">
          <div>
            <h1>Booking history</h1>
            <p>All your tickets, most recently booked first.</p>
          </div>
          <Link to="/book" className="btn btn-primary">+ Book tickets</Link>
        </header>

        {notice && (
          <div className="confirm-banner is-info" role="status">
            <span className="confirm-check" aria-hidden="true">i</span>
            <div>
              <p>
                <strong>Booking {notice.id} cancelled.</strong> A refund of {formatCurrency(notice.cancellation.refund)} has been
                initiated and will reach you in 5–7 working days.
              </p>
            </div>
            <button type="button" className="icon-btn" onClick={() => setNotice(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        {content}
      </main>

      {cancelling && <CancelBookingDialog booking={cancelling} onClose={() => setCancelling(null)} onCancelled={onCancelled} />}
    </>
  )
}
