import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatusMessage from '../components/common/StatusMessage'
import StepError from '../components/booking/StepError'
import { PosterImage } from '../components/movies/MovieCard'
import { useAuth } from '../context/AuthContext'
import useAsync from '../hooks/useAsync'
import { getMyBookings } from '../services/bookingApi'
import { formatCurrency, formatShowTime } from '../utils/format'
import '../styles/listing.css'
import './Movies.css'
import './Booking.css'

function BookingRow({ booking: b }) {
  const start = new Date(b.startsAt)
  return (
    <li>
      <Link to={`/bookings/${b.id}`} className="booking-row">
        <div className="booking-row-poster">
          <PosterImage path={b.movie.poster_path} title={b.movie.title} size="w185" />
        </div>
        <div className="booking-row-info">
          <p className="pick-title">{b.movie.title}</p>
          <p className="pick-meta">{b.theatre.name}</p>
          <p className="pick-meta">
            {start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, {formatShowTime(b.showTime)} ·{' '}
            {b.screen.name} · Seats {b.seats.join(', ')}
          </p>
        </div>
        <div className="booking-row-side">
          <span className="booking-row-id">{b.id}</span>
          <span className="booking-row-total">{formatCurrency(b.total)}</span>
        </div>
      </Link>
    </li>
  )
}

export default function MyBookings() {
  const { user } = useAuth()
  const bookings = useAsync((signal) => getMyBookings(user, { signal }), user.id)
  const [now] = useState(() => Date.now()) // when the page opened: splits upcoming/past

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
    const upcoming = bookings.data.filter((b) => new Date(b.startsAt) > now)
    const past = bookings.data.filter((b) => new Date(b.startsAt) <= now)
    content = (
      <>
        <section aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="rows-title">Upcoming ({upcoming.length})</h2>
          {upcoming.length ? (
            <ul className="booking-rows">
              {upcoming.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </ul>
          ) : (
            <p className="step-empty">No upcoming shows. <Link to="/book">Book tickets</Link></p>
          )}
        </section>
        {past.length > 0 && (
          <section aria-labelledby="past-title">
            <h2 id="past-title" className="rows-title">Past ({past.length})</h2>
            <ul className="booking-rows is-past">
              {past.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </ul>
          </section>
        )}
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="booking-page">
        <header className="list-header">
          <div>
            <h1>My bookings</h1>
            <p>Your tickets, newest first.</p>
          </div>
          <Link to="/book" className="btn btn-primary">+ Book tickets</Link>
        </header>
        {content}
      </main>
    </>
  )
}
