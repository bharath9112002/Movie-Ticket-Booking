import { seededRandom } from '../../services/mockUtils'

const SIZE = 25

// Decorative QR-style code derived from `value` (stable per value; not scannable).
export default function FakeQr({ value }) {
  let seed = 0
  for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) | 0
  const random = seededRandom(seed)

  // The three corner "finder" squares, 7×7 each.
  const finders = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ]
  const inFinder = (x, y) => finders.some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7)

  const cells = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!inFinder(x, y) && random() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    }
  }

  return (
    <svg className="fake-qr" viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`} role="img" aria-label="UPI QR code">
      <rect x="-2" y="-2" width={SIZE + 4} height={SIZE + 4} className="fake-qr-bg" />
      {finders.map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect x={fx} y={fy} width="7" height="7" />
          <rect x={fx + 1} y={fy + 1} width="5" height="5" className="fake-qr-bg" />
          <rect x={fx + 2} y={fy + 2} width="3" height="3" />
        </g>
      ))}
      {cells}
    </svg>
  )
}
