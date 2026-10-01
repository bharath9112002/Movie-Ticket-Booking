const STATUS = {
  Confirmed: { icon: '✓', className: 'is-good' },
  Pending: { icon: '⏳', className: 'is-warning' },
  Cancelled: { icon: '✕', className: 'is-critical' },
}

// Part-to-whole of booking statuses: one stacked bar plus a labelled legend (icon + label + count).
export default function StatusBreakdown({ counts }) {
  const total = counts.reduce((s, c) => s + c.count, 0)
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)

  return (
    <div className="status-breakdown">
      <div className="status-stack" aria-hidden="true">
        {counts
          .filter((c) => c.count)
          .map((c) => (
            <span key={c.status} className={STATUS[c.status].className} style={{ flexGrow: c.count }} title={`${c.status}: ${c.count}`} />
          ))}
      </div>
      <ul className="status-legend">
        {counts.map((c) => (
          <li key={c.status}>
            <span className={`status-swatch ${STATUS[c.status].className}`} aria-hidden="true">
              {STATUS[c.status].icon}
            </span>
            <span className="status-legend-label">{c.status}</span>
            <span className="status-legend-value">
              {c.count} <span className="muted">({pct(c.count)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
