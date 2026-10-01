import { statusLabel } from '../../utils/bookingStatus'

const ICONS = { upcoming: '●', completed: '✓', cancelled: '✕' }

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge is-${status}`}>
      <span aria-hidden="true">{ICONS[status]}</span> {statusLabel(status)}
    </span>
  )
}
