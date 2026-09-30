import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatusMessage from '../components/common/StatusMessage'
import SeatPicker from '../components/seats/SeatPicker'
import { getShowSeats } from '../services/theatreApi'
import { bookingUrl, parseShowId } from '../utils/bookingFlow'
import { formatShowTime } from '../utils/format'
import '../styles/listing.css'
import './SeatSelection.css'


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
    content = (
      <SeatPicker
        key={showId}
        data={state.data}
        onProceed={(seats) =>
          navigate(
            bookingUrl({
              movie: String(state.data.movie.id),
              ...parseShowId(showId),
              show: showId,
              seats,
            }),
          )
        }
      />
    )
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
