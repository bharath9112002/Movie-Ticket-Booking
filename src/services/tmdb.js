import * as mock from './mockMovieApi'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export const MAX_PAGES = 500

export const isConfigured = Boolean(ACCESS_TOKEN || API_KEY)
export const usingMockData = !isConfigured

export class TmdbError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'TmdbError'
    this.status = status
  }
}

async function request(path, params = {}, { signal } = {}) {
  if (!isConfigured) {
    throw new TmdbError(
      'TMDB API key is missing. Add VITE_TMDB_ACCESS_TOKEN or VITE_TMDB_API_KEY to .env.local and restart the dev server.',
    )
  }

  const url = new URL(BASE_URL + path)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  if (!ACCESS_TOKEN) url.searchParams.set('api_key', API_KEY)

  let response
  try {
    response = await fetch(url, {
      signal,
      headers: {
        accept: 'application/json',
        ...(ACCESS_TOKEN && { Authorization: `Bearer ${ACCESS_TOKEN}` }),
      },
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new TmdbError('Could not reach TMDB. Check your internet connection and try again.')
  }

  if (!response.ok) {
    const messages = {
      401: 'TMDB rejected the API key. Check the key in .env.local.',
      404: 'The requested movie could not be found.',
      429: 'Too many requests to TMDB. Please wait a moment and try again.',
    }
    throw new TmdbError(
      messages[response.status] ?? `TMDB request failed (HTTP ${response.status}).`,
      response.status,
    )
  }
  return response.json()
}

let genresPromise
export function getGenres() {
  genresPromise ??= (
    isConfigured
      ? request('/genre/movie/list', { language: 'en-US' }).then((data) => data.genres)
      : mock.getGenres()
  )
    .catch((err) => {
      genresPromise = undefined // allow a retry after a failure
      throw err
    })
  return genresPromise
}

// Curated list of original languages offered in the filter.
export const LANGUAGES = ['en', 'ta', 'hi', 'te', 'ml', 'kn', 'ko', 'ja', 'fr', 'es', 'zh', 'de', 'it']

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })
export const languageName = (code) => {
  if (!code) return 'Unknown'
  try {
    return languageNames.of(code)
  } catch {
    return code.toUpperCase()
  }
}

export const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'primary_release_date.desc', label: 'Release date: newest' },
  { value: 'primary_release_date.asc', label: 'Release date: oldest' },
  { value: 'vote_average.desc', label: 'Top rated' },
]

export const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '8', label: '8+ ★' },
  { value: '7', label: '7+ ★' },
  { value: '6', label: '6+ ★' },
  { value: '5', label: '5+ ★' },
]

const today = () => new Date().toISOString().slice(0, 10)

/** Browse movies with server-side filters and sorting. */
export function discoverMovies({ page = 1, genre, language, minRating, sort = 'popularity.desc' }, options) {
  if (!isConfigured) return mock.discoverMovies({ page, genre, language, minRating, sort }, options)
  const byDate = sort.startsWith('primary_release_date')
  const byRating = sort.startsWith('vote_average')
  return request(
    '/discover/movie',
    {
      page,
      sort_by: sort,
      include_adult: false,
      with_genres: genre,
      with_original_language: language,
      'vote_average.gte': minRating,
      // Keep rating filters/sorts meaningful by ignoring films with a handful of votes,
      // and keep "newest" from surfacing unannounced titles years in the future.
      'vote_count.gte': minRating || byRating ? 100 : byDate ? 10 : undefined,
      'primary_release_date.lte': byDate ? today() : undefined,
    },
    options,
  )
}

/**
 * Full-text search. TMDB search ignores genre/language/rating/sort, so callers
 * refine those per page; the mock applies them itself (see searchSupportsFilters).
 */
export const searchSupportsFilters = usingMockData

export function searchMovies({ query, page = 1, ...filters }, options) {
  if (!isConfigured) return mock.searchMovies({ query, page, ...filters }, options)
  return request('/search/movie', { query, page, include_adult: false }, options)
}

/** Full details for one movie, including videos and cast. */
export function getMovieDetails(id, options) {
  if (!isConfigured) return mock.getMovieDetails(id, options)
  return request(`/movie/${id}`, { append_to_response: 'videos,credits,release_dates' }, options)
}

// Runtime isn't part of list responses, so cards look it up per movie (cached).
// The shared request is deliberately not abortable: several cards may await it.
const runtimeCache = new Map()
export function getRuntime(id) {
  if (!runtimeCache.has(id)) {
    const promise = (
      isConfigured ? request(`/movie/${id}`).then((m) => m.runtime || null) : mock.getRuntime(id)
    )
      .catch((err) => {
        runtimeCache.delete(id)
        throw err
      })
    runtimeCache.set(id, promise)
  }
  return runtimeCache.get(id)
}

// TMDB returns bare file paths like "/abc.jpg"; the mock returns ready-to-use URLs
// (data: URIs, or files under public/demo/).
const MOCK_ASSET_PREFIX = `${import.meta.env.BASE_URL}demo/`
const imageUrl = (path, size) => {
  if (!path) return null
  if (/^(data:|https?:)/.test(path) || path.startsWith(MOCK_ASSET_PREFIX)) return path
  return `${IMAGE_BASE}/${size}${path}`
}

export const posterUrl = (path, size = 'w342') => imageUrl(path, size)
export const backdropUrl = (path, size = 'w1280') => imageUrl(path, size)
export const profileUrl = (path, size = 'w185') => imageUrl(path, size)

// CSS background-image value: the backdrop, layered over the mock's generated
// fallback (if any) so something still shows when the photo can't load.
export const backdropLayers = (movie, size) =>
  [backdropUrl(movie.backdrop_path, size), movie.backdrop_fallback]
    .filter(Boolean)
    .map((url) => `url("${url}")`)
    .join(', ') || null

export const formatRuntime = (minutes) => {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export const formatReleaseDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBA'
