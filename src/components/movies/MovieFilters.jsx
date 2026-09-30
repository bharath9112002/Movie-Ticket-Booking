import { useCallback } from 'react'
import SearchBox from '../common/SearchBox'
import { LANGUAGES, RATING_OPTIONS, SORT_OPTIONS, languageName } from '../../services/tmdb'

export default function MovieFilters({ filters, genres, onChange, onReset }) {
  const onSearch = useCallback((q) => onChange({ q }), [onChange])

  const hasFilters = filters.q || filters.genre || filters.lang || filters.rating || filters.sort !== SORT_OPTIONS[0].value

  return (
    <div className="list-filters" role="search">
      <SearchBox value={filters.q} onSearch={onSearch} placeholder="Search movies by title…" label="Search movies" />

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
    </div>
  )
}
