// Offline stand-in for the TMDB API, used when no TMDB key is configured.
// Responses mirror TMDB's shapes so the UI doesn't care which source it talks to.
// The catalogue is real films (see scripts/fetch-demo-movies.mjs); posters are bundled locally.

import demoMovies from '../data/demoMovies.json'
import { MockApiError, paginate as paginateList, respond } from './mockUtils'

export const PAGE_SIZE = 12

// Same ids TMDB uses, so genre filters behave identically.
const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
]

const POSTER_COLORS = {
  28: ['#e50914', '#3a0306'],
  12: ['#f97316', '#3b1402'],
  16: ['#f59e0b', '#3f2503'],
  35: ['#a855f7', '#26093f'],
  80: ['#64748b', '#0f172a'],
  18: ['#14b8a6', '#042f2c'],
  14: ['#8b5cf6', '#1e0b46'],
  36: ['#b45309', '#2b1603'],
  27: ['#7f1d1d', '#050505'],
  10402: ['#ec4899', '#3d0621'],
  9648: ['#6366f1', '#0f0e33'],
  10749: ['#f43f5e', '#420915'],
  878: ['#3b82f6', '#06163a'],
  53: ['#475569', '#020617'],
}

const CATALOGUE = demoMovies

const genreName = (id) => GENRES.find((g) => g.id === id)?.name ?? ''

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

// Break a title into lines of at most ~12 characters for the poster.
function titleLines(title) {
  const lines = []
  title.split(' ').forEach((word) => {
    const last = lines[lines.length - 1]
    if (last && (last + ' ' + word).length <= 12) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  })
  return lines.slice(0, 3)
}

function makePoster(id, title, genreId) {
  const [from, to] = POSTER_COLORS[genreId] ?? ['#52525b', '#18181b']
  const lines = titleLines(title)
  const startY = 360 - (lines.length - 1) * 26
  const text = lines
    .map((line, i) => `<text x="171" y="${startY + i * 52}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#fff">${escapeXml(line.toUpperCase())}</text>`)
    .join('')
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 513">
      <defs>
        <linearGradient id="g${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
        <radialGradient id="r${id}" cx="0.5" cy="0.3" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="342" height="513" fill="url(#g${id})"/>
      <circle cx="171" cy="170" r="150" fill="url(#r${id})"/>
      <text x="171" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="190" font-weight="700" fill="#fff" fill-opacity="0.16">${escapeXml(title.charAt(0))}</text>
      ${text}
      <rect x="131" y="470" width="80" height="3" rx="1.5" fill="#fff" fill-opacity="0.6"/>
    </svg>`,
  )
}

function makeBackdrop(id, genreId) {
  const [from, to] = POSTER_COLORS[genreId] ?? ['#52525b', '#18181b']
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
      <defs><linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${to}"/><stop offset="0.6" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
      <rect width="1280" height="720" fill="url(#b${id})"/>
      <circle cx="980" cy="260" r="320" fill="#fff" fill-opacity="0.07"/>
      <circle cx="1100" cy="520" r="180" fill="#fff" fill-opacity="0.05"/>
    </svg>`,
  )
}

// Real films: posters and facts come from Wikipedia/Wikidata via
// scripts/fetch-demo-movies.mjs; posters are bundled in public/demo/posters.
const posterUrl = (file) => `${import.meta.env.BASE_URL}demo/posters/${file}`

const MOVIES = CATALOGUE.map((m) => ({
  id: m.id,
  title: m.title,
  original_title: m.title,
  genre_ids: m.genre_ids,
  genres: m.genre_ids.map((gid) => ({ id: gid, name: genreName(gid) })),
  original_language: m.original_language,
  runtime: m.runtime,
  vote_average: m.vote_average,
  vote_count: m.vote_count,
  release_date: m.release_date,
  popularity: m.popularity,
  tagline: null,
  overview: m.overview,
  poster_path: posterUrl(m.poster_file),
  poster_fallback: makePoster(m.id, m.title, m.genre_ids[0]),
  // No backdrops on Wikipedia; the poster doubles as one (shown dimmed).
  backdrop_path: posterUrl(m.poster_file),
  backdrop_fallback: makeBackdrop(m.id, m.genre_ids[0]),
  credits: {
    cast: m.cast.map((name, n) => ({ credit_id: `${m.id}-cast-${n}`, name, character: '', profile_path: null })),
    crew: m.directors.map((name, n) => ({ credit_id: `${m.id}-dir-${n}`, job: 'Director', name })),
  },
  release_dates: { results: [] },
}))

const paginate = (list, page) => paginateList(list, page, PAGE_SIZE)

function applyFilters(list, { genre, language, minRating, sort = 'popularity.desc', query }) {
  const q = query?.trim().toLowerCase()
  const filtered = list.filter(
    (m) =>
      (!q || m.title.toLowerCase().includes(q)) &&
      (!genre || m.genre_ids.includes(Number(genre))) &&
      (!language || m.original_language === language) &&
      (!minRating || m.vote_average >= Number(minRating)),
  )
  const [field, direction] = sort.split('.')
  const key = {
    popularity: (m) => m.popularity,
    vote_average: (m) => m.vote_average,
    primary_release_date: (m) => m.release_date,
  }[field] ?? ((m) => m.popularity)
  return filtered.sort((a, b) => {
    const diff = key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
    return direction === 'asc' ? diff : -diff
  })
}

// List endpoints return summaries, like TMDB (no runtime, credits or tagline).
const summary = ({ runtime: _r, credits: _c, tagline: _t, genres: _g, release_dates: _d, ...rest }) => rest

// Summaries of the most popular titles, for other mocks (e.g. theatre show times).
export const popularMovies = (count) =>
  [...MOVIES].sort((a, b) => b.popularity - a.popularity).slice(0, count).map(summary)

export const getGenres = () => respond(() => GENRES)

export const discoverMovies = ({ page = 1, ...filters }, { signal } = {}) =>
  respond(() => {
    const data = paginate(applyFilters(MOVIES, filters), page)
    return { ...data, results: data.results.map(summary) }
  }, signal)

// Unlike TMDB, the mock search can combine the query with filters and sorting.
export const searchMovies = ({ query, page = 1, ...filters }, { signal } = {}) =>
  respond(() => {
    const data = paginate(applyFilters(MOVIES, { ...filters, query }), page)
    return { ...data, results: data.results.map(summary) }
  }, signal)

export const getMovieDetails = (id, { signal } = {}) =>
  respond(() => {
    const movie = MOVIES.find((m) => m.id === Number(id))
    if (!movie) throw new MockApiError('The requested movie could not be found.', 404)
    return movie
  }, signal)

export const getRuntime = (id) => getMovieDetails(id).then((m) => m.runtime || null)
