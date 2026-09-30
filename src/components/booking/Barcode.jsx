// Decorative barcode derived from the booking id (stable for a given id; not a real symbology).
export default function Barcode({ value, height = 56 }) {
  const bars = []
  let x = 0
  for (const char of value) {
    const code = char.charCodeAt(0)
    for (let bit = 0; bit < 7; bit++) {
      const wide = (code >> bit) & 1
      const width = wide ? 3 : 1.5
      if (bit % 2 === 0) bars.push(<rect key={`${x}`} x={x} y="0" width={width} height={height} />)
      x += width + 1.2
    }
  }
  return (
    <svg className="barcode" viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Barcode for ${value}`}>
      {bars}
    </svg>
  )
}
