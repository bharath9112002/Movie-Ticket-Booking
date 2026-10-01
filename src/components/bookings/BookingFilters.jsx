import { useCallback } from 'react'
import SearchBox from '../common/SearchBox'
import { BOOKING_STATUSES, DATE_PRESETS } from '../../utils/bookingStatus'

export default function BookingFilters({ filters, movies, counts, onChange, onReset }) {
  const onSearch = useCallback((q) => onChange({ q }), [onChange])
  const hasFilters = filters.q || filters.movie || filters.booked || filters.status
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="list-filters" role="search">
      <SearchBox
        value={filters.q}
        onSearch={onSearch}
        placeholder="Search by booking ID, movie, theatre or seat…"
        label="Search bookings"
      />

      <div className="history-filter-row">
        <label className="select-field">
          <span>Movie</span>
          <select value={filters.movie} onChange={(e) => onChange({ movie: e.target.value })}>
            <option value="">All movies</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Booked on</span>
          <select
            value={filters.booked}
            onChange={(e) => onChange({ booked: e.target.value, from: '', to: '' })}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {filters.booked === 'custom' && (
          <>
            <label className="select-field">
              <span>From</span>
              <input
                type="date"
                className="date-input"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => onChange({ from: e.target.value })}
              />
            </label>
            <label className="select-field">
              <span>To</span>
              <input
                type="date"
                className="date-input"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => onChange({ to: e.target.value })}
              />
            </label>
          </>
        )}

        <button type="button" className="btn btn-outline reset-btn" onClick={onReset} disabled={!hasFilters}>
          Reset
        </button>
      </div>

      <div className="city-chips" role="group" aria-label="Filter by status">
        <button type="button" className="city-chip" aria-pressed={!filters.status} onClick={() => onChange({ status: '' })}>
          All <span className="chip-count">{total}</span>
        </button>
        {BOOKING_STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`city-chip status-chip is-${s.key}`}
            aria-pressed={filters.status === s.key}
            onClick={() => onChange({ status: filters.status === s.key ? '' : s.key })}
          >
            {s.label} <span className="chip-count">{counts[s.key] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
