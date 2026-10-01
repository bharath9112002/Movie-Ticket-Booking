import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'

// `days` is an oldest-first list of { date, revenue } for the chart.
export default function RevenueSummary({ days, totals }) {
  const max = Math.max(...days.map((d) => d.revenue), 1)

  return (
    <section className="panel revenue fade-up" style={{ '--i': 8 }}>
      <header className="panel-head">
        <h2>Revenue summary</h2>
        <Link to="/reports" className="link-sm">Full report →</Link>
      </header>

      <dl className="revenue-totals">
        <div>
          <dt>Today</dt>
          <dd>{formatCurrency(totals.today)}</dd>
        </div>
        <div>
          <dt>Last 7 days</dt>
          <dd>{formatCurrency(totals.week)}</dd>
        </div>
        <div>
          <dt>Last 30 days</dt>
          <dd>{formatCurrency(totals.month)}</dd>
        </div>
        <div>
          <dt>Avg. per booking</dt>
          <dd>{formatCurrency(totals.average)}</dd>
        </div>
      </dl>

      <p className="chart-title">Daily revenue, last 7 days</p>
      <div className="bar-chart" role="list">
        {days.map((d, i) => {
          const isToday = i === days.length - 1
          const label = d.date.toLocaleDateString('en-IN', { weekday: 'short' })
          const full = d.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
          return (
            <div
              key={d.date.toISOString()}
              className={`bar-col${isToday ? ' is-today' : ''}`}
              role="listitem"
              tabIndex={0}
              aria-label={`${full}: ${formatCurrency(d.revenue)}`}
            >
              <span className="bar-tip" aria-hidden="true">
                <strong>{formatCurrency(d.revenue)}</strong>
                {full}
              </span>
              <div className="bar-track">
                <div className="bar" style={{ height: `${(d.revenue / max) * 100}%` }}>
                  {isToday && <span className="bar-flag" aria-hidden="true">Today</span>}
                </div>
              </div>
              <span className="bar-label" aria-hidden="true">{label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
