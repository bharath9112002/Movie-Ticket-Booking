import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getRuntime,
  posterUrl,
  languageName,
  formatRuntime,
  formatReleaseDate,
} from '../../services/tmdb'

export function RatingBadge({ value }) {
  const rating = value ? value.toFixed(1) : 'NR'
  const tier = !value ? 'none' : value >= 7 ? 'high' : value >= 5 ? 'mid' : 'low'
  return (
    <span className={`rating rating-${tier}`} aria-label={value ? `Rated ${rating} out of 10` : 'Not rated'}>
      <span aria-hidden="true">★</span> {rating}
    </span>
  )
}

export function PosterImage({ path, title, size }) {
  const [failed, setFailed] = useState(false)
  const src = posterUrl(path, size)
  if (!src || failed) {
    return (
      <div className="poster-fallback" role="img" aria-label={`${title} poster unavailable`}>
        <span aria-hidden="true">🎬</span>
      </div>
    )
  }
  return <img src={src} alt={`${title} poster`} loading="lazy" onError={() => setFailed(true)} />
}

export default function MovieCard({ movie, genreMap, onTrailer }) {
  // List responses don't include runtime; look it up separately.
  const [runtime, setRuntime] = useState(undefined)

  useEffect(() => {
    let active = true
    getRuntime(movie.id)
      .then((minutes) => active && setRuntime(minutes))
      .catch(() => active && setRuntime(null))
    return () => {
      active = false
    }
  }, [movie.id])

  const genres = movie.genre_ids.map((id) => genreMap[id]).filter(Boolean)

  return (
    <article className="movie-card">
      <Link to={`/movies/${movie.id}`} className="movie-poster" tabIndex={-1} aria-hidden="true">
        <PosterImage path={movie.poster_path} title={movie.title} />
        <RatingBadge value={movie.vote_average} />
      </Link>

      <div className="movie-body">
        <h3 className="movie-title">
          <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
        </h3>

        <ul className="movie-genres" aria-label="Genres">
          {genres.length ? (
            genres.slice(0, 3).map((g) => <li key={g}>{g}</li>)
          ) : (
            <li>Uncategorised</li>
          )}
        </ul>

        <dl className="movie-meta">
          <div>
            <dt>Language</dt>
            <dd>{languageName(movie.original_language)}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{runtime === undefined ? <span className="shimmer-text" aria-label="Loading" /> : formatRuntime(runtime)}</dd>
          </div>
          <div>
            <dt>Release</dt>
            <dd>{formatReleaseDate(movie.release_date)}</dd>
          </div>
        </dl>

        <p className="movie-overview">{movie.overview || 'No description available.'}</p>

        <div className="movie-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onTrailer(movie)}>
            ▶ Trailer
          </button>
          <Link to={`/movies/${movie.id}`} className="btn btn-outline btn-sm">
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}

export function MovieCardSkeleton() {
  return (
    <div className="movie-card skeleton" aria-hidden="true">
      <div className="movie-poster shimmer" />
      <div className="movie-body">
        <div className="shimmer line w-80" />
        <div className="shimmer line w-50" />
        <div className="shimmer line w-90" />
        <div className="shimmer line w-70" />
      </div>
    </div>
  )
}
