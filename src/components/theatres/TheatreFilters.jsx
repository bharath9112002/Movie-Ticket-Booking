import SearchBox from '../common/SearchBox'

export default function TheatreFilters({ query, city, cities, onSearch, onCity }) {
  const total = cities.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="list-filters" role="search">
      <SearchBox
        value={query}
        onSearch={onSearch}
        placeholder="Search by theatre name, area or address…"
        label="Search theatres"
      />
      <div className="city-chips" role="group" aria-label="Filter by city">
        <button type="button" className="city-chip" aria-pressed={!city} onClick={() => onCity('')}>
          All cities {total > 0 && <span className="chip-count">{total}</span>}
        </button>
        {cities.map((c) => (
          <button
            key={c.name}
            type="button"
            className="city-chip"
            aria-pressed={city === c.name}
            onClick={() => onCity(city === c.name ? '' : c.name)}
          >
            {c.name} <span className="chip-count">{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
