import { useState } from 'react'
import { Link } from 'react-router-dom'
import StepError from './StepError'
import { PosterImage, RatingBadge } from '../movies/MovieCard'
import useAsync from '../../hooks/useAsync'
import { getNowShowing } from '../../services/theatreApi'
import { languageName } from '../../services/tmdb'
import { bookingUrl } from '../../utils/bookingFlow'

export default function MovieStep() {
  const movies = useAsync((signal) => getNowShowing({ signal }), 'now-showing')
  const [query, setQuery] = useState('')

  if (movies.status === 'loading') {
    return (
      <div className="pick-grid movies" aria-busy="true" aria-label="Loading movies">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="pick-movie skeleton">
            <div className="pick-poster shimmer" />
            <div className="shimmer line w-70" />
          </div>
        ))}
      </div>
    )
  }
  if (movies.status === 'error') return <StepError error={movies.error} onRetry={movies.reload} />

  const q = query.trim().toLowerCase()
  const list = movies.data.filter((m) => !q || m.title.toLowerCase().includes(q))

  return (
    <section aria-labelledby="step-title">
      <div className="step-head">
        <h2 id="step-title">Which movie would you like to watch?</h2>
        <input
          type="search"
          className="step-search"
          placeholder="Filter movies…"
          aria-label="Filter movies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {list.length === 0 ? (
        <p className="step-empty">No movies match “{query}”.</p>
      ) : (
        <ul className="pick-grid movies">
          {list.map((m) => (
            <li key={m.id}>
              <Link to={bookingUrl({ movie: String(m.id) })} className="pick-movie">
                <div className="pick-poster">
                  <PosterImage path={m.poster_path} fallback={m.poster_fallback} title={m.title} />
                  <RatingBadge value={m.vote_average} />
                </div>
                <p className="pick-title">{m.title}</p>
                <p className="pick-meta">
                  {languageName(m.original_language)} · {m.theatreCount} theatre{m.theatreCount === 1 ? '' : 's'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
