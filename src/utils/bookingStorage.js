// Confirmed bookings live in localStorage (there is no backend). Shared by every
// account in this browser, so seats one user books show as booked for the others.
const BOOKINGS_KEY = 'mtb_bookings'

export function readBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function writeBookings(list) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list))
}

/** Seat ids already taken by confirmed bookings for one show. */
export function getLocalBookedSeats(showId) {
  return new Set(
    readBookings()
      .filter((b) => b.showId === showId && b.status === 'confirmed')
      .flatMap((b) => b.seats),
  )
}
