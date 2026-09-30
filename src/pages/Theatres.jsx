import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Pagination from '../components/common/Pagination'
import StatusMessage from '../components/common/StatusMessage'
import TheatreCard, { TheatreCardSkeleton } from '../components/theatres/TheatreCard'
import TheatreFilters from '../components/theatres/TheatreFilters'
import { PAGE_SIZE, getCities, getTheatres } from '../services/theatreApi'
import '../styles/listing.css'
import './Theatres.css'

export default function Theatres() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      city: params.get('city') ?? '',
      page: Math.max(Number(params.get('page')) || 1, 1),
    }),
    [params],
  )

  const [cities, setCities] = useState([])
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${params.toString()}|${reloadKey}`
  const [response, setResponse] = useState({ key: null })
  const state = response.key === requestKey ? response : { status: 'loading' }

  useEffect(() => {
    // Without cities the chips just don't render; the list still works.
    getCities().then(setCities).catch(() => {})
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getTheatres({ query: filters.q, city: filters.city, page: filters.page }, { signal: controller.signal })
      .then((data) => setResponse({ key: requestKey, status: 'success', ...data }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResponse({ key: requestKey, status: 'error', error })
      })
    return () => controller.abort()
  }, [filters, requestKey])

  const updateFilters = useCallback(
    (changes) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
        if (!('page' in changes)) next.delete('page') // new filters start from page 1
        return next
      })
    },
    [setParams],
  )

  const onSearch = useCallback((q) => updateFilters({ q }), [updateFilters])
  const onCity = useCallback((city) => updateFilters({ city }), [updateFilters])

  const goToPage = (page) => {
    updateFilters({ page: page === 1 ? '' : String(page) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const summary = () => {
    const where = filters.city ? ` in ${filters.city}` : ''
    const what = filters.q ? ` matching “${filters.q}”` : ''
    return `${state.total_results} theatre${state.total_results === 1 ? '' : 's'}${where}${what}`
  }

  return (
    <>
      <Navbar />
      <main className="list-page">
        <header className="list-header">
          <div>
            <h1>Theatres</h1>
            <p>Find a cinema near you, check its screens and today&apos;s show timings.</p>
          </div>
          {state.status === 'success' && <span className="result-count">{summary()}</span>}
        </header>

        <TheatreFilters
          query={filters.q}
          city={filters.city}
          cities={cities}
          onSearch={onSearch}
          onCity={onCity}
        />

        {state.status === 'loading' ? (
          <div className="theatre-grid" aria-busy="true" aria-label="Loading theatres">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
              <TheatreCardSkeleton key={i} />
            ))}
          </div>
        ) : state.status === 'error' ? (
          <StatusMessage
            icon="⚠️"
            title="Couldn't load theatres"
            message={state.error.message}
            action={
              <button type="button" className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            }
          />
        ) : state.results.length === 0 ? (
          <StatusMessage
            icon="🏛️"
            title="No theatres found"
            message="Try a different search or pick another city."
            action={
              <button type="button" className="btn btn-outline" onClick={() => setParams({})}>
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="theatre-grid">
              {state.results.map((theatre) => (
                <TheatreCard key={theatre.id} theatre={theatre} />
              ))}
            </div>
            <Pagination page={state.page} totalPages={state.total_pages} onChange={goToPage} />
          </>
        )}
      </main>
    </>
  )
}
