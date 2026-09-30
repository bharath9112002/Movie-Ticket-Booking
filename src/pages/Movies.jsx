import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MovieCard, { MovieCardSkeleton } from '../components/movies/MovieCard'
import MovieFilters from '../components/movies/MovieFilters'
import Pagination from '../components/common/Pagination'
import StatusMessage from '../components/common/StatusMessage'
import TrailerModal from '../components/movies/TrailerModal'
import {
  MAX_PAGES,
  SORT_OPTIONS,
  discoverMovies,
  getGenres,
  searchMovies,
  searchSupportsFilters,
  usingMockData,
} from '../services/tmdb'
import '../styles/listing.css'
import './Movies.css'

const DEFAULT_SORT = SORT_OPTIONS[0].value
const SKELETON_COUNT = 8

// TMDB search ignores genre/language/rating/sort, so apply them to the fetched page here.
function refineSearchResults(results, { genre, lang, rating, sort }) {
  const filtered = results.filter(
    (m) =>
      (!genre || m.genre_ids.includes(Number(genre))) &&
      (!lang || m.original_language === lang) &&
      (!rating || m.vote_average >= Number(rating)),
  )
  const [field, direction] = sort.split('.')
  if (field === 'popularity') return filtered
  const key = field === 'vote_average' ? (m) => m.vote_average : (m) => m.release_date || ''
  return [...filtered].sort((a, b) => {
    const diff = key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
    return direction === 'asc' ? diff : -diff
  })
}

export default function Movies() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      genre: params.get('genre') ?? '',
      lang: params.get('lang') ?? '',
      rating: params.get('rating') ?? '',
      sort: params.get('sort') ?? DEFAULT_SORT,
      page: Math.min(Math.max(Number(params.get('page')) || 1, 1), MAX_PAGES),
    }),
    [params],
  )

  const [genres, setGenres] = useState([])
  const [reloadKey, setReloadKey] = useState(0)
  // Each response remembers which request it answers; anything else means we're loading.
  const requestKey = `${params.toString()}|${reloadKey}`
  const [response, setResponse] = useState({ key: null })
  const state = response.key === requestKey ? response : { status: 'loading' }
  const [trailerMovie, setTrailerMovie] = useState(null)

  useEffect(() => {
    // A genre failure isn't fatal: cards just show fewer labels.
    getGenres().then(setGenres).catch(() => {})
  }, [])

  const genreMap = useMemo(() => Object.fromEntries(genres.map((g) => [g.id, g.name])), [genres])

  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }

    const request = filters.q
      ? searchMovies(
          {
            query: filters.q,
            page: filters.page,
            genre: filters.genre,
            language: filters.lang,
            minRating: filters.rating,
            sort: filters.sort,
          },
          options,
        )
      : discoverMovies(
          {
            page: filters.page,
            genre: filters.genre,
            language: filters.lang,
            minRating: filters.rating,
            sort: filters.sort,
          },
          options,
        )

    request
      .then((data) => {
        setResponse({
          key: requestKey,
          status: 'success',
          results: filters.q && !searchSupportsFilters ? refineSearchResults(data.results, filters) : data.results,
          totalPages: Math.min(data.total_pages, MAX_PAGES),
          totalResults: data.total_results,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setResponse({ key: requestKey, status: 'error', error })
      })

    return () => controller.abort()
  }, [filters, requestKey])

  const updateFilters = useCallback(
    (changes) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '' || value === undefined || (key === 'sort' && value === DEFAULT_SORT)) next.delete(key)
          else next.set(key, value)
        })
        if (!('page' in changes)) next.delete('page') // new filters start from page 1
        return next
      })
    },
    [setParams],
  )

  const goToPage = (page) => {
    updateFilters({ page: page === 1 ? '' : String(page) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeTrailer = useCallback(() => setTrailerMovie(null), [])

  const searchNarrowed = !searchSupportsFilters && filters.q && (filters.genre || filters.lang || filters.rating)

  return (
    <>
      <Navbar />
      <main className="list-page">
        <header className="list-header">
          <div>
            <h1>Movies</h1>
            <p>{usingMockData ? 'Browse, search and filter our demo catalogue.' : 'Browse, search and filter thousands of titles from TMDB.'}</p>
          </div>
          {state.status === 'success' && (
            <span className="result-count">
              {filters.q ? `${state.totalResults.toLocaleString('en-IN')} results for “${filters.q}”` : `${state.totalResults.toLocaleString('en-IN')} movies`}
            </span>
          )}
        </header>

        <MovieFilters
          filters={filters}
          genres={genres}
          onChange={updateFilters}
          onReset={() => setParams({})}
        />

        {searchNarrowed && (
          <p className="filter-note">
            While searching, genre, language and rating filters apply to the results on each page.
          </p>
        )}

        {usingMockData && (
          <p className="demo-banner" role="note">
            <strong>Demo mode</strong> — showing built-in sample movies. Add a TMDB key to{' '}
            <code>.env.local</code> for live data.
          </p>
        )}

        {state.status === 'error' ? (
          <StatusMessage
            icon="⚠️"
            title="Couldn't load movies"
            message={state.error.message}
            action={
              <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            }
          />
        ) : state.status === 'loading' ? (
          <div className="movie-grid" aria-busy="true" aria-label="Loading movies">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : state.results.length === 0 ? (
          <>
            <StatusMessage
              icon="🎞️"
              title="No movies found"
              message={
                searchNarrowed && state.totalPages > 1
                  ? 'Nothing on this page matches your filters. Try another page or loosen the filters.'
                  : 'Try a different search or loosen the filters.'
              }
              action={
                <button type="button" className="btn btn-outline" onClick={() => setParams({})}>
                  Clear filters
                </button>
              }
            />
            <Pagination page={filters.page} totalPages={state.totalPages} onChange={goToPage} />
          </>
        ) : (
          <>
            <div className="movie-grid">
              {state.results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} genreMap={genreMap} onTrailer={setTrailerMovie} />
              ))}
            </div>
            <Pagination page={filters.page} totalPages={state.totalPages} onChange={goToPage} />
          </>
        )}
      </main>

      {trailerMovie && <TrailerModal movie={trailerMovie} onClose={closeTrailer} />}
    </>
  )
}
