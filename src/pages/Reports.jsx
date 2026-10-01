import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatCard from '../components/dashboard/StatCard'
import RankedBars from '../components/reports/RankedBars'
import StatusBreakdown from '../components/reports/StatusBreakdown'
import TrendChart from '../components/reports/TrendChart'
import { formatCurrency, formatDate, formatNumber } from '../utils/format'
import { REPORT_RANGES, computeReport } from '../utils/reports'
import './Dashboard.css'
import './Reports.css'

const compactCurrency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 })
const formatCompact = (v) => compactCurrency.format(v)
const formatPercent = (v) => `${v}%`

const trend = (value, days) => (value == null ? undefined : { value, label: `${value >= 0 ? 'up' : 'down'} vs previous ${days} days` })

function DailyTable({ daily }) {
  return (
    <details className="report-table">
      <summary>View daily figures as a table</summary>
      <div className="report-table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Bookings</th>
              <th scope="col">Tickets</th>
              <th scope="col">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {[...daily].reverse().map((d) => (
              <tr key={d.date.toISOString()}>
                <th scope="row">{d.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</th>
                <td>{d.bookings}</td>
                <td>{d.tickets}</td>
                <td>{formatCurrency(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export default function Reports() {
  const [params, setParams] = useSearchParams()
  const range = REPORT_RANGES.find((r) => String(r.days) === params.get('range')) ?? REPORT_RANGES[0]
  const [now] = useState(() => new Date())
  const report = useMemo(() => computeReport(range.days, now), [range.days, now])
  const { totals, change, occupancy, topMovie, topTheatre } = report
  const days = range.days

  const cards = [
    { icon: '🎟️', label: 'Total bookings', value: formatNumber(totals.bookings), hint: `${totals.cancelled} cancelled`, trend: trend(change.bookings, days), tone: 'violet' },
    { icon: '💰', label: 'Total revenue', value: formatCurrency(totals.revenue), hint: 'Excludes cancellations', trend: trend(change.revenue, days), tone: 'teal' },
    { icon: '🍿', label: 'Tickets sold', value: formatNumber(totals.tickets), hint: `${(totals.tickets / days).toFixed(1)} per day`, trend: trend(change.tickets, days), tone: 'blue' },
    { icon: '🧾', label: 'Avg. booking value', value: formatCurrency(totals.avgValue), hint: 'Per paid booking', trend: trend(change.avgValue, days), tone: 'amber' },
    { icon: '💺', label: 'Seat occupancy', value: formatPercent(occupancy.rate), hint: `${formatNumber(occupancy.booked)} of ${formatNumber(occupancy.seats)} seats`, tone: 'green' },
    {
      icon: '↩️',
      label: 'Cancellation rate',
      value: formatPercent(totals.bookings ? Math.round((totals.cancelled / totals.bookings) * 100) : 0),
      hint: `${totals.cancelled} of ${totals.bookings} bookings`,
      tone: 'accent',
    },
  ]

  const ticketShare = (n) => (totals.tickets ? Math.round((n / totals.tickets) * 100) : 0)

  return (
    <>
      <Navbar />
      <main className="dashboard reports-page">
        <header className="reports-header fade-up">
          <div>
            <h1>Reports &amp; analytics</h1>
            <p>
              {formatDate(report.from)} – {formatDate(report.to)} · <span className="panel-tag">Dummy data</span>
            </p>
          </div>
          <div className="range-toggle" role="radiogroup" aria-label="Report period">
            {REPORT_RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                role="radio"
                aria-checked={r.days === days}
                onClick={() => setParams(r === REPORT_RANGES[0] ? {} : { range: String(r.days) }, { replace: true })}
              >
                {r.label}
              </button>
            ))}
          </div>
        </header>

        <section className="stat-grid" aria-label="Key figures">
          {cards.map((c, i) => (
            <StatCard key={c.label} index={i + 1} {...c} />
          ))}
        </section>
        {!report.comparable && <p className="reports-note">Change vs the previous period isn&rsquo;t shown: the dummy data only covers 30 days.</p>}

        <section className="highlight-grid" aria-label="Top performers">
          <article className="highlight-card fade-up" style={{ '--i': 7 }}>
            <span className="highlight-icon" aria-hidden="true">🏆</span>
            <div>
              <p className="highlight-label">Most booked movie</p>
              {topMovie ? (
                <>
                  <h2>{topMovie.name}</h2>
                  <p className="highlight-meta">
                    {formatNumber(topMovie.tickets)} tickets ({ticketShare(topMovie.tickets)}% of all) · {topMovie.bookings} bookings ·{' '}
                    {formatCurrency(topMovie.revenue)}
                  </p>
                </>
              ) : (
                <h2>No bookings yet</h2>
              )}
            </div>
          </article>
          <article className="highlight-card fade-up" style={{ '--i': 8 }}>
            <span className="highlight-icon" aria-hidden="true">🏛️</span>
            <div>
              <p className="highlight-label">Most popular theatre</p>
              {topTheatre ? (
                <>
                  <h2>{topTheatre.name}</h2>
                  <p className="highlight-meta">
                    {formatNumber(topTheatre.tickets)} tickets ({ticketShare(topTheatre.tickets)}% of all) · {topTheatre.bookings} bookings ·{' '}
                    {formatCurrency(topTheatre.revenue)}
                  </p>
                </>
              ) : (
                <h2>No bookings yet</h2>
              )}
            </div>
          </article>
        </section>

        <div className="reports-columns">
          <section className="panel fade-up" style={{ '--i': 9 }} aria-labelledby="trend-title">
            <header className="panel-head">
              <h2 id="trend-title">Daily bookings</h2>
              <span className="panel-tag">Bookings per day</span>
            </header>
            <TrendChart
              type="bar"
              label="Bookings per day"
              data={report.daily.map((d) => ({ date: d.date, value: d.bookings }))}
              formatValue={formatNumber}
              unit="bookings"
            />
          </section>

          <section className="panel fade-up" style={{ '--i': 10 }} aria-labelledby="revenue-title">
            <header className="panel-head">
              <h2 id="revenue-title">Daily revenue</h2>
              <span className="panel-tag">{formatCurrency(totals.revenue)} total</span>
            </header>
            <TrendChart
              type="area"
              label="Revenue per day"
              data={report.daily.map((d) => ({ date: d.date, value: d.revenue }))}
              formatValue={formatCurrency}
              formatAxis={formatCompact}
            />
          </section>
        </div>
        <DailyTable daily={report.daily} />

        <div className="reports-columns">
          <section className="panel fade-up" style={{ '--i': 11 }} aria-labelledby="movie-revenue-title">
            <header className="panel-head">
              <h2 id="movie-revenue-title">Revenue by movie</h2>
            </header>
            <RankedBars
              label="Revenue by movie"
              items={[...report.byMovie].sort((a, b) => b.revenue - a.revenue)}
              value={(m) => m.revenue}
              format={formatCurrency}
              detail={(m) => `${formatNumber(m.tickets)} tickets · ${m.bookings} bookings`}
            />
          </section>

          <section className="panel fade-up" style={{ '--i': 12 }} aria-labelledby="theatre-revenue-title">
            <header className="panel-head">
              <h2 id="theatre-revenue-title">Revenue by theatre</h2>
            </header>
            <RankedBars
              label="Revenue by theatre"
              items={[...report.byTheatre].sort((a, b) => b.revenue - a.revenue)}
              value={(t) => t.revenue}
              format={formatCurrency}
              detail={(t) => `${formatNumber(t.tickets)} tickets · ${t.bookings} bookings`}
            />
          </section>
        </div>

        <div className="reports-columns">
          <section className="panel fade-up" style={{ '--i': 13 }} aria-labelledby="occupancy-title">
            <header className="panel-head">
              <h2 id="occupancy-title">Seat occupancy by theatre</h2>
              <span className="panel-tag">Today + next 2 days</span>
            </header>
            <div className="occupancy-hero">
              <span className="occupancy-value">{formatPercent(occupancy.rate)}</span>
              <span className="muted">
                overall · {formatNumber(occupancy.booked)} of {formatNumber(occupancy.seats)} seats across {occupancy.shows} shows
              </span>
            </div>
            <RankedBars
              label="Seat occupancy by theatre"
              items={occupancy.byTheatre}
              value={(t) => t.rate}
              max={100}
              format={formatPercent}
              detail={(t) => `${t.city} · ${t.shows} shows · ${formatNumber(t.booked)} / ${formatNumber(t.seats)} seats`}
            />
          </section>

          <div className="reports-stack">
            <section className="panel fade-up" style={{ '--i': 14 }} aria-labelledby="status-title">
              <header className="panel-head">
                <h2 id="status-title">Booking status</h2>
                <span className="panel-tag">{totals.bookings} bookings</span>
              </header>
              <StatusBreakdown counts={report.statusCounts} />
            </section>

            <section className="panel fade-up" style={{ '--i': 15 }} aria-labelledby="movie-occupancy-title">
              <header className="panel-head">
                <h2 id="movie-occupancy-title">Occupancy by movie</h2>
              </header>
              <RankedBars
                label="Seat occupancy by movie"
                items={occupancy.byMovie}
                value={(m) => m.rate}
                max={100}
                format={formatPercent}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
