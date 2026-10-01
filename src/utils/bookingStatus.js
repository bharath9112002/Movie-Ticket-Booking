// Booking status, cancellation/refund rules and booking-history filters.

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export const BOOKING_STATUSES = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export const statusLabel = (status) => BOOKING_STATUSES.find((s) => s.key === status)?.label ?? status

export function bookingStatus(booking, now) {
  if (booking.status === 'cancelled') return 'cancelled'
  return new Date(booking.startsAt).getTime() > now ? 'upcoming' : 'completed'
}

// Ticket price refund by notice given; the booking fee is never refunded.
export const REFUND_POLICY = [
  { minHours: 24, percent: 100, label: '24 hours or more before the show' },
  { minHours: 4, percent: 50, label: '4 to 24 hours before the show' },
]
export const CANCEL_CUTOFF_HOURS = REFUND_POLICY[REFUND_POLICY.length - 1].minHours

/** Whether `booking` can be cancelled at `now`, and what would be refunded. */
export function refundQuote(booking, now) {
  const hoursLeft = (new Date(booking.startsAt).getTime() - now) / HOUR
  const tickets = booking.tickets ?? booking.total - booking.fee
  const base = { hoursLeft, tickets, fee: booking.fee, total: booking.total }

  if (booking.status === 'cancelled') return { ...base, allowed: false, reason: 'This booking is already cancelled.' }
  if (hoursLeft <= 0) return { ...base, allowed: false, reason: 'This show has already started.' }
  const tier = REFUND_POLICY.find((p) => hoursLeft >= p.minHours)
  if (!tier) {
    return { ...base, allowed: false, reason: `Bookings can't be cancelled within ${CANCEL_CUTOFF_HOURS} hours of the show.` }
  }
  return { ...base, allowed: true, percent: tier.percent, refund: Math.round((tickets * tier.percent) / 100) }
}

// ---------- History filters ----------

export const DATE_PRESETS = [
  { value: '', label: 'Any time' },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 3 months', days: 90 },
  { value: 'custom', label: 'Custom range' },
]

/** Local calendar date as YYYY-MM-DD (what <input type="date"> uses). */
export function dateKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function matchesBookedDate(booking, { booked, from, to }, now) {
  if (!booked) return true
  const key = dateKey(booking.createdAt)
  if (booked === 'custom') return (!from || key >= from) && (!to || key <= to)
  const preset = DATE_PRESETS.find((p) => p.value === booked)
  return !preset?.days || key >= dateKey(now - (preset.days - 1) * DAY)
}

function matchesSearch(b, q) {
  if (!q) return true
  const needle = q.toLowerCase()
  return [b.id, b.movie.title, b.theatre.name, b.screen.name, ...b.seats].some((v) => v.toLowerCase().includes(needle))
}

/**
 * Applies search, movie and booking-date filters. Status is applied separately so the
 * status tabs can show how many bookings each would contain.
 */
export function filterBookings(bookings, filters, now) {
  return bookings.filter(
    (b) => matchesSearch(b, filters.q) && (!filters.movie || String(b.movie.id) === filters.movie) && matchesBookedDate(b, filters, now),
  )
}
