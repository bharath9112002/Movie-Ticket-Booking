import { formatCurrency } from '../../utils/format'

const STATUS_TEXT = { available: 'available', booked: 'already booked', selected: 'selected' }

export default function SeatMap({ rows, tiers, selectedIds, onToggle }) {
  const priceOf = Object.fromEntries(tiers.map((t) => [t.name, t.price]))

  return (
    <div className="seat-map-scroll">
      <div className="seat-map" role="group" aria-label="Seat layout. The screen is at the bottom.">
        {rows.map((row, r) => {
          const newTier = r === 0 || rows[r - 1].tier !== row.tier
          return (
            <div key={row.label} className="seat-row-wrap">
              {newTier && (
                <p className="tier-label">
                  {row.tier} <span>· {formatCurrency(priceOf[row.tier])}</span>
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
                              title={`${seat.id} · ${seat.tier} · ${formatCurrency(seat.price)}`}
                              onClick={() => onToggle(seat)}
                            >
                              {seat.number}
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
          <span className="screen-curve" />
          <span className="screen-text">All eyes this way please</span>
        </div>
      </div>
    </div>
  )
}
