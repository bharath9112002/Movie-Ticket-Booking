// `trend` is an optional { value: number, label: string }, e.g. +12% vs yesterday.
export default function StatCard({ icon, label, value, hint, trend, tone = 'accent', index = 0 }) {
  const direction = trend && (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat')

  return (
    <article className={`stat-card tone-${tone} fade-up`} style={{ '--i': index }}>
      <div className="stat-top">
        <span className="stat-icon" aria-hidden="true">{icon}</span>
        {trend && (
          <span className={`trend trend-${direction}`} title={trend.label}>
            <span aria-hidden="true">{direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●'}</span>
            {Math.abs(trend.value)}%
            <span className="sr-only"> {trend.label}</span>
          </span>
        )}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </article>
  )
}
