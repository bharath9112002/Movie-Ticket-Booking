import { formatCurrency } from '../../utils/format'
import { tierColorMap } from '../../utils/seatTheme'

const STATUS_TEXT = { available: 'available', booked: 'already booked', selected: 'selected' }

export default function SeatMap({ rows, tiers, selectedIds, onToggle }) {
  const priceOf = Object.fromEntries(tiers.map((t) => [t.name, t.price]))
  const colorOf = tierColorMap(tiers)
  // Widest row, so seats can be sized to fill the panel (see --cols in SeatSelection.css).
  const cols = Math.max(...rows.map((row) => row.blocks.reduce((n, block) => n + block.length, 0)))

  return (
    <div className="seat-map-scroll">
      <div
        className="seat-map"
        role="group"
        aria-label="Seat layout. The screen is at the bottom."
        style={{ '--cols': cols }}
      >
        {rows.map((row, r) => {
          const newTier = r === 0 || rows[r - 1].tier !== row.tier
          return (
            <div key={row.label} className="seat-row-wrap" style={{ '--tier': colorOf[row.tier] }}>
              {newTier && (
                <p className="tier-label">
                  <span className="tier-name">
                    <span className="tier-dot" aria-hidden="true" />
                    {row.tier}
                  </span>
                  <span className="tier-price">{formatCurrency(priceOf[row.tier])}</span>
                </p>
              )}
              <div className="seat-row">
                <span className="row-label" aria-hidden="true">{row.label}</span>
                <div className="seat-blocks">
                  {row.blocks.map((block, b) =>
                    block.length ? (
                      <div key={b} className="seat-block">
                        {block.map((seat) => {
                          const status = selectedIds.has(seat.id) ? 'selected' : seat.status
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              className={`seat is-${status}`}
                              disabled={seat.status === 'booked'}
                              aria-pressed={status === 'selected'}
                              aria-label={`Row ${seat.row}, seat ${seat.number}, ${seat.tier} ${formatCurrency(seat.price)}, ${STATUS_TEXT[status]}`}
                              data-tip={`${seat.id} · ${formatCurrency(seat.price)}`}
                              onClick={() => onToggle(seat)}
                            >
                              <span className="seat-num">{seat.number}</span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div key={b} className="seat-block is-empty" aria-hidden="true" />
                    ),
                  )}
                </div>
                <span className="row-label" aria-hidden="true">{row.label}</span>
              </div>
            </div>
          )
        })}

        <div className="screen-indicator" aria-hidden="true">
          <span className="screen-glow" />
          <span className="screen-curve" />
          <span className="screen-text">Screen this way</span>
        </div>
      </div>
    </div>
  )
}
