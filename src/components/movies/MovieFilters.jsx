import { useCallback, useEffect, useRef, useState } from 'react'
import { LANGUAGES, RATING_OPTIONS, SORT_OPTIONS, languageName } from '../../services/tmdb'

const SEARCH_DELAY = 400

export default function MovieFilters({ filters, genres, onChange, onReset }) {
  const [query, setQuery] = useState(filters.q)
  const lastSubmitted = useRef(filters.q)

  const submit = useCallback(
    (value) => {
      lastSubmitted.current = value
      onChange({ q: value })
    },
    [onChange],
  )

  // Keep the box in sync when the URL changes from elsewhere (back button, reset),
  // without clobbering text typed after the last debounced submit.
  useEffect(() => {
    if (filters.q !== lastSubmitted.current) {
      lastSubmitted.current = filters.q
      setQuery(filters.q)
    }
  }, [filters.q])

  // Debounce typing before it hits the API.
  useEffect(() => {
    const value = query.trim()
    if (value === lastSubmitted.current) return
    const timer = setTimeout(() => submit(value), SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [query, submit])

  const hasFilters = filters.q || filters.genre || filters.lang || filters.rating || filters.sort !== SORT_OPTIONS[0].value

  return (
    <form className="movie-filters" role="search" onSubmit={(e) => {
      e.preventDefault()
      submit(query.trim())
    }}>
      <div className="search-box">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies by title…"
          aria-label="Search movies"
        />
      </div>

      <div className="filter-row">
        <label className="select-field">
          <span>Genre</span>
          <select value={filters.genre} onChange={(e) => onChange({ genre: e.target.value })}>
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Language</span>
          <select value={filters.lang} onChange={(e) => onChange({ lang: e.target.value })}>
            <option value="">All languages</option>
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>{languageName(code)}</option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Rating</span>
          <select value={filters.rating} onChange={(e) => onChange({ rating: e.target.value })}>
            {RATING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Sort by</span>
          <select value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>

        <button type="button" className="btn btn-outline reset-btn" onClick={onReset} disabled={!hasFilters}>
          Reset
        </button>
      </div>
    </form>
  )
}
