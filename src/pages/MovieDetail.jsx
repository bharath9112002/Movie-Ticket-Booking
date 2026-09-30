import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { PosterImage, RatingBadge } from '../components/movies/MovieCard'
import StatusMessage from '../components/common/StatusMessage'
import TrailerModal from '../components/movies/TrailerModal'
import {
  backdropLayers,
  formatReleaseDate,
  formatRuntime,
  getMovieDetails,
  languageName,
  profileUrl,
} from '../services/tmdb'
import '../styles/listing.css'
import './Movies.css'

const CAST_LIMIT = 12

// Indian certification if available, otherwise the US one.
function certification(movie) {
  const countries = movie.release_dates?.results ?? []
  for (const code of ['IN', 'US']) {
    const entry = countries.find((c) => c.iso_3166_1 === code)
    const cert = entry?.release_dates.find((r) => r.certification)?.certification
    if (cert) return cert
  }
  return null
}

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${id}|${reloadKey}`
  const [response, setResponse] = useState({ key: null })
  const state = response.key === requestKey ? response : { status: 'loading' }
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getMovieDetails(id, { signal: controller.signal })
      .then((movie) => setResponse({ key: requestKey, status: 'success', movie }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResponse({ key: requestKey, status: 'error', error })
      })
    window.scrollTo(0, 0)
    return () => controller.abort()
  }, [id, requestKey])

  const closeTrailer = useCallback(() => setShowTrailer(false), [])

  // Go back to the list with its filters intact when we came from it.
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/movies'))

  if (state.status === 'loading') {
    return (
      <>
        <Navbar />
        <main className="detail-page">
          <div className="detail-hero skeleton" aria-busy="true" aria-label="Loading movie">
            <div className="detail-inner">
              <div className="detail-poster shimmer" />
              <div className="detail-info">
                <div className="shimmer line w-60 tall" />
                <div className="shimmer line w-40" />
                <div className="shimmer line w-90" />
                <div className="shimmer line w-80" />
                <div className="shimmer line w-70" />
              </div>
            </div>
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
        <main className="detail-page">
          <StatusMessage
            icon={notFound ? '🎞️' : '⚠️'}
            title={notFound ? 'Movie not found' : "Couldn't load this movie"}
            message={state.error.message}
            action={
              <div className="status-actions">
                {!notFound && (
                  <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
                    Try again
                  </button>
                )}
                <Link to="/movies" className="btn btn-outline">Back to movies</Link>
              </div>
            }
          />
        </main>
      </>
    )
  }

  const { movie } = state
  const year = movie.release_date?.slice(0, 4)
  const cert = certification(movie)
  const directors = movie.credits?.crew.filter((c) => c.job === 'Director').map((c) => c.name) ?? []
  const cast = movie.credits?.cast.slice(0, CAST_LIMIT) ?? []
  const backdrop = backdropLayers(movie)

  return (
    <>
      <Navbar />
      <main className="detail-page">
        <section
          className="detail-hero"
          style={backdrop ? { '--backdrop': backdrop } : undefined}
        >
          <div className="detail-inner">
            <div className="detail-poster">
              <PosterImage path={movie.poster_path} fallback={movie.poster_fallback} title={movie.title} size="w500" />
            </div>

            <div className="detail-info">
              <button type="button" className="back-link" onClick={goBack}>
                ← Back to movies
              </button>

              <h1>
                {movie.title} {year && <span className="detail-year">({year})</span>}
              </h1>
              {movie.tagline && <p className="detail-tagline">“{movie.tagline}”</p>}

              <div className="detail-facts">
                <RatingBadge value={movie.vote_average} />
                {movie.vote_count > 0 && (
                  <span className="fact-muted">{movie.vote_count.toLocaleString('en-IN')} votes</span>
                )}
                {cert && <span className="cert">{cert}</span>}
              </div>

              <ul className="movie-genres">
                {movie.genres.length ? movie.genres.map((g) => <li key={g.id}>{g.name}</li>) : <li>Uncategorised</li>}
              </ul>

              <dl className="detail-meta">
                <div>
                  <dt>Language</dt>
                  <dd>{languageName(movie.original_language)}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{formatRuntime(movie.runtime)}</dd>
                </div>
                <div>
                  <dt>Release date</dt>
                  <dd>{formatReleaseDate(movie.release_date)}</dd>
                </div>
                {directors.length > 0 && (
                  <div>
                    <dt>Director</dt>
                    <dd>{directors.join(', ')}</dd>
                  </div>
                )}
              </dl>

              <h2 className="detail-subtitle">Overview</h2>
              <p className="detail-overview">{movie.overview || 'No description available.'}</p>

              <div className="detail-actions">
                <button type="button" className="btn btn-primary" onClick={() => setShowTrailer(true)}>
                  ▶ Watch trailer
                </button>
                <Link to="/bookings" className="btn btn-glass">🎟️ Book tickets</Link>
              </div>
            </div>
          </div>
        </section>

        {cast.length > 0 && (
          <section className="cast-section">
            <h2 className="section-title">Top cast</h2>
            <ul className="cast-row">
              {cast.map((person) => (
                <li key={person.credit_id} className="cast-card">
                  {person.profile_path ? (
                    <img src={profileUrl(person.profile_path)} alt="" loading="lazy" />
                  ) : (
                    <span className="cast-fallback" aria-hidden="true">👤</span>
                  )}
                  <p className="cast-name">{person.name}</p>
                  {person.character && <p className="cast-role">{person.character}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {showTrailer && <TrailerModal movie={movie} onClose={closeTrailer} />}
    </>
  )
}
