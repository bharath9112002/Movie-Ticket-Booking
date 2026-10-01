import { useEffect, useRef, useState } from 'react'

const HEIGHT = 230
const MARGIN = { top: 22, right: 12, bottom: 26, left: 52 }
const MIN_LABEL_GAP = 58 // px between x-axis labels

// Rounds the axis maximum up to 1/2/2.5/5 × 10^n so ticks land on readable numbers.
function niceMax(value) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)
  return step * magnitude
}

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

// Bar with only its data end (the top) rounded, anchored square to the baseline.
function barPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${y + h}Z`
}

/**
 * Single-series daily chart. `type` is 'bar' (counts) or 'area' (a running measure).
 * `data`: [{ date, value }]. Hover or arrow keys show a tooltip for one day.
 */
export default function TrendChart({ data, type = 'bar', label, formatValue, formatAxis = formatValue, unit }) {
  const [ref, width] = useWidth()
  const [active, setActive] = useState(null)

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right)
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom
  const max = niceMax(Math.max(...data.map((d) => d.value)))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
  const band = data.length ? plotW / data.length : 0
  const xCenter = (i) => MARGIN.left + band * (i + 0.5)
  const y = (v) => MARGIN.top + plotH - (v / max) * plotH
  const labelEvery = Math.max(1, Math.ceil(MIN_LABEL_GAP / (band || 1)))
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)

  const dayLabel = (date, long) =>
    date.toLocaleDateString('en-IN', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' })

  const onPointer = (e) => {
    const box = e.currentTarget.ownerSVGElement.getBoundingClientRect()
    const i = Math.floor((e.clientX - box.left - MARGIN.left) / band)
    setActive(i >= 0 && i < data.length ? i : null)
  }

  const onKeyDown = (e) => {
    const next = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : data.length - 1)
    } else if (next) {
      e.preventDefault()
      setActive((a) => Math.min(data.length - 1, Math.max(0, (a ?? (next > 0 ? -1 : data.length)) + next)))
    }
  }

  const barW = Math.max(2, Math.min(28, band - 4)) // ≥2px surface gap between neighbours
  const points = data.map((d, i) => [xCenter(i), y(d.value)])
  const linePath = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join('')
  const areaPath = points.length ? `${linePath}L${points.at(-1)[0]},${y(0)}L${points[0][0]},${y(0)}Z` : ''

  const tip = active != null ? data[active] : null
  const tipLeft = tip ? Math.min(Math.max(xCenter(active), 70), width - 70) : 0

  return (
    <div
      ref={ref}
      className="trend-chart"
      role="group"
      aria-label={`${label}. Use left and right arrow keys to read each day.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg width={width} height={HEIGHT} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} />
              <text className="chart-axis" x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {formatAxis(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              // Skip a regular label that would collide with the always-shown last one.
              i !== data.length - 1 && data.length - 1 - i < labelEvery ? null : (
                <text key={d.date.toISOString()} className="chart-axis" x={xCenter(i)} y={HEIGHT - 6} textAnchor="middle">
                  {dayLabel(d.date)}
                </text>
              )
            ) : null,
          )}

          {type === 'bar' ? (
            data.map((d, i) => {
              const h = y(0) - y(d.value)
              return h > 0 ? (
                <path
                  key={d.date.toISOString()}
                  className={`chart-bar${active != null && active !== i ? ' is-dim' : ''}`}
                  d={barPath(xCenter(i) - barW / 2, y(d.value), barW, h, 4)}
                />
              ) : null
            })
          ) : (
            <>
              <path className="chart-area" d={areaPath} />
              <path className="chart-line" d={linePath} />
            </>
          )}

          {/* Selective direct label: the peak only. */}
          {data[peak]?.value > 0 && (
            <text className="chart-peak" x={xCenter(peak)} y={y(data[peak].value) - 8} textAnchor="middle">
              {formatValue(data[peak].value)}
            </text>
          )}

          {tip && (
            <g className="chart-focus">
              <line x1={xCenter(active)} x2={xCenter(active)} y1={MARGIN.top} y2={y(0)} />
              {type === 'area' && <circle cx={xCenter(active)} cy={y(tip.value)} r="5" />}
            </g>
          )}

          <rect
            className="chart-hit"
            x={MARGIN.left}
            y={0}
            width={plotW}
            height={HEIGHT}
            onPointerMove={onPointer}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
      )}

      {tip && (
        <div className="chart-tooltip" style={{ left: tipLeft, top: Math.max(4, y(tip.value) - 64) }}>
          <span>{dayLabel(tip.date, true)}</span>
          <strong>
            {formatValue(tip.value)}
            {unit && ` ${unit}`}
          </strong>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {tip ? `${dayLabel(tip.date, true)}: ${formatValue(tip.value)}${unit ? ` ${unit}` : ''}` : ''}
      </p>
    </div>
  )
}
