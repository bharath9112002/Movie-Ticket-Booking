const FORMAT_ICONS = {
  Standard: '🎞️',
  'Dolby Atmos': '🔊',
  Recliner: '🛋️',
  IMAX: '🎥',
  '4DX': '💨',
}

export default function ScreenList({ screens }) {
  const open = screens.filter((s) => s.status === 'open').length

  return (
    <section className="side-card">
      <header className="side-card-head">
        <h2>Screens</h2>
        <span className="panel-tag">{open} of {screens.length} available</span>
      </header>
      <ul className="screen-list">
        {screens.map((screen) => (
          <li key={screen.id} className={`screen-item${screen.status === 'open' ? '' : ' is-closed'}`}>
            <span className="screen-icon" aria-hidden="true">{FORMAT_ICONS[screen.type] ?? '🎞️'}</span>
            <div className="screen-info">
              <p className="screen-name">{screen.name}</p>
              <p className="screen-meta">
                {screen.type} · {screen.seats} seats · from ₹{screen.basePrice}
              </p>
            </div>
            <span className={`screen-status is-${screen.status}`}>
              {screen.status === 'open' ? 'Open' : 'Maintenance'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
