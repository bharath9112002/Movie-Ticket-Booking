import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatusMessage from '../components/common/StatusMessage'
import ScreenList from '../components/theatres/ScreenList'
import ShowTimings from '../components/theatres/ShowTimings'
import { directionsUrl, getTheatre, mapEmbedUrl, upcomingDates } from '../services/theatreApi'
import '../styles/listing.css'
import './Theatres.css'

export default function TheatreDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()

  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${id}|${reloadKey}`
  const [response, setResponse] = useState({ key: null })
  const state = response.key === requestKey ? response : { status: 'loading' }

  // The selected date lives in the URL so it survives refreshes and sharing.
  const dates = upcomingDates()
  const selectedDate = dates.includes(params.get('date')) ? params.get('date') : dates[0]
  const selectDate = (date) =>
    setParams(date === dates[0] ? {} : { date }, { replace: true, preventScrollReset: true })

  useEffect(() => {
    const controller = new AbortController()
    getTheatre(id, { signal: controller.signal })
      .then((theatre) => setResponse({ key: requestKey, status: 'success', theatre }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResponse({ key: requestKey, status: 'error', error })
      })
    return () => controller.abort()
  }, [id, requestKey])

  // Braces matter: newer browsers return a Promise from scrollTo, which React would treat as a cleanup.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/theatres'))

  if (state.status === 'loading') {
    return (
      <>
        <Navbar />
        <main className="theatre-detail" aria-busy="true" aria-label="Loading theatre">
          <div className="theatre-hero skeleton">
            <div className="shimmer line w-30" />
            <div className="shimmer line tall w-50" />
            <div className="shimmer line w-70" />
          </div>
          <div className="theatre-layout">
            <div className="shimmer block tall-block" />
            <div className="shimmer block tall-block" />
          </div>
        </main>
      </>
    )
  }

  if (state.status === 'error') {
    const notFound = state.error.status === 404
    return (
      <>
        <Navbar />
        <main className="theatre-detail">
          <StatusMessage
            icon={notFound ? '🏛️' : '⚠️'}
            title={notFound ? 'Theatre not found' : "Couldn't load this theatre"}
            message={state.error.message}
            action={
              <div className="status-actions">
                {!notFound && (
                  <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
                    Try again
                  </button>
                )}
                <Link to="/theatres" className="btn btn-outline">Back to theatres</Link>
              </div>
            }
          />
        </main>
      </>
    )
  }

  const { theatre } = state
  const tel = `tel:${theatre.phone.replace(/\s/g, '')}`

  return (
    <>
      <Navbar />
      <main className="theatre-detail">
        <section className="theatre-hero">
          <button type="button" className="back-link" onClick={goBack}>
            ← Back to theatres
          </button>
          <div className="theatre-hero-row">
            <div className="theatre-hero-text">
              <div className="theatre-badges">
                <span className="brand-chip">{theatre.brand}</span>
                <span className="theatre-rating" aria-label={`Rated ${theatre.rating} out of 5`}>
                  <span aria-hidden="true">★</span> {theatre.rating}
                </span>
                <span className="panel-tag">{theatre.city}</span>
              </div>
              <h1>{theatre.name}</h1>
              <p className="theatre-address">
                <span aria-hidden="true">📍</span> {theatre.address}
              </p>
              <ul className="amenities" aria-label="Amenities">
                {theatre.amenities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="theatre-hero-actions">
              <a href={tel} className="btn btn-primary">📞 Call theatre</a>
              <a href={directionsUrl(theatre)} target="_blank" rel="noreferrer" className="btn btn-glass">
                Directions ↗
              </a>
            </div>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>Screens</dt>
              <dd>{theatre.screenCount}</dd>
            </div>
            <div>
              <dt>Open now</dt>
              <dd>{theatre.openScreens}</dd>
            </div>
            <div>
              <dt>Shows left today</dt>
              <dd>{theatre.availableShowsToday}</dd>
            </div>
            <div>
              <dt>Formats</dt>
              <dd>{theatre.screenTypes.length}</dd>
            </div>
          </dl>
        </section>

        <div className="theatre-layout">
          <ShowTimings
            theatreId={theatre.id}
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={selectDate}
          />

          <aside className="theatre-side">
            <section className="side-card">
              <header className="side-card-head">
                <h2>Location</h2>
              </header>
              <div className="map-frame">
                <iframe
                  title={`Map showing ${theatre.name}`}
                  src={mapEmbedUrl(theatre)}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="side-address">{theatre.address}</p>
              <a href={directionsUrl(theatre)} target="_blank" rel="noreferrer" className="link-sm">
                Open in Google Maps ↗
              </a>
            </section>

            <section className="side-card">
              <header className="side-card-head">
                <h2>Contact</h2>
              </header>
              <ul className="contact-list">
                <li>
                  <span className="contact-icon" aria-hidden="true">📞</span>
                  <div>
                    <p className="contact-label">Phone</p>
                    <a href={tel}>{theatre.phone}</a>
                  </div>
                </li>
                <li>
                  <span className="contact-icon" aria-hidden="true">✉️</span>
                  <div>
                    <p className="contact-label">Email</p>
                    <a href={`mailto:${theatre.email}`}>{theatre.email}</a>
                  </div>
                </li>
                <li>
                  <span className="contact-icon" aria-hidden="true">🕘</span>
                  <div>
                    <p className="contact-label">Box office</p>
                    <p>8:00 AM – 11:30 PM, all days</p>
                  </div>
                </li>
              </ul>
            </section>

            <ScreenList screens={theatre.screens} />
          </aside>
        </div>
      </main>
    </>
  )
}
