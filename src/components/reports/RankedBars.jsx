// Horizontal ranked bars (one series, one colour). Each row is labelled with its value,
// so the list doubles as its own table.
export default function RankedBars({ items, value, format, max, detail, label, highlightFirst = false }) {
  const top = max ?? Math.max(...items.map(value), 1)

  return (
    <ol className="ranked-bars" aria-label={label}>
      {items.map((item, i) => {
        const v = value(item)
        return (
          <li key={item.key} className={highlightFirst && i === 0 ? 'is-top' : undefined}>
            <div className="ranked-head">
              <span className="ranked-name">
                <span className="ranked-pos" aria-hidden="true">{i + 1}</span>
                {item.name}
              </span>
              <span className="ranked-value">{format(v)}</span>
            </div>
            <div className="ranked-track" aria-hidden="true">
              <span style={{ width: `${(v / top) * 100}%` }} />
            </div>
            {detail && <p className="ranked-detail">{detail(item)}</p>}
          </li>
        )
      })}
    </ol>
  )
}
