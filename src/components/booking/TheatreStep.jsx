import { useState } from 'react'
import { Link } from 'react-router-dom'
import StepError from './StepError'
import useAsync from '../../hooks/useAsync'
import { getTheatresForMovie } from '../../services/theatreApi'
import { bookingUrl, urlForStep } from '../../utils/bookingFlow'
import { formatShowTime } from '../../utils/format'

const dayLabel = (iso) => {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(Date.now() + 864e5)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function TheatreStep({ state }) {
  const theatres = useAsync((signal) => getTheatresForMovie(state.movie, { signal }), state.movie)
  const [city, setCity] = useState('')

  if (theatres.status === 'loading') {
    return (
      <div className="pick-list" aria-busy="true" aria-label="Loading theatres">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="pick-theatre skeleton">
            <div className="shimmer line w-50" />
            <div className="shimmer line w-80" />
          </div>
        ))}
      </div>
    )
  }
  if (theatres.status === 'error') {
    return (
      <StepError
        error={theatres.error}
        onRetry={theatres.reload}
        back={<Link to={urlForStep(state, 'movie')} className="btn btn-outline">Choose another movie</Link>}
      />
    )
  }

  const cities = [...new Set(theatres.data.map((t) => t.city))]
  const list = theatres.data.filter((t) => !city || t.city === city)

  return (
    <section aria-labelledby="step-title">
      <div className="step-head">
        <h2 id="step-title">Pick a theatre</h2>
        <span className="panel-tag">{theatres.data.length} theatres showing this movie</span>
      </div>

      <div className="city-chips" role="group" aria-label="Filter by city">
        <button type="button" className="city-chip" aria-pressed={!city} onClick={() => setCity('')}>
          All cities
        </button>
        {cities.map((c) => (
          <button key={c} type="button" className="city-chip" aria-pressed={city === c} onClick={() => setCity(city === c ? '' : c)}>
            {c}
          </button>
        ))}
      </div>

      <ul className="pick-list">
        {list.map((t) => (
          <li key={t.id}>
            <Link to={bookingUrl({ movie: state.movie, theatre: String(t.id) })} className="pick-theatre">
              <div className="pick-theatre-main">
                <p className="pick-title">{t.name}</p>
                <p className="pick-meta">📍 {t.address}</p>
                <ul className="format-chips" aria-label="Formats">
                  {t.formats.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="pick-theatre-side">
                <span className="pick-count">{t.showCount} shows</span>
                <span className="pick-meta">
                  Next: {dayLabel(t.nextShow.startsAt)}, {formatShowTime(t.nextShow.time)}
                </span>
                <span className="pick-arrow" aria-hidden="true">→</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
