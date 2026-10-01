// Mock booking API backed by localStorage (see utils/bookingStorage.js).

import { readBookings, writeBookings } from '../utils/bookingStorage'
import { priceBreakdown } from '../utils/pricing'
import { MockApiError, respond } from './mockUtils'
import { MAX_SEATS_PER_BOOKING, loadShowSeats } from './theatreApi'

// No 0/O/1/I so IDs are easy to read out at the counter.
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// e.g. CB261001-7KQ4XP: prefix, booking date (YYMMDD), 6 random characters.
function generateBookingId(existing) {
  const d = new Date()
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    const code = [...bytes].map((b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('')
    const id = `CB${date}-${code}`
    if (!existing.some((b) => b.id === id)) return id
  }
}

/**
 * Confirms a booking. Guards against duplicates in two ways:
 * - `requestId` makes the call idempotent: repeating it (double click, refresh,
 *   back button) returns the booking already made instead of a second one;
 * - seats already taken — by anyone — are rejected with a 409.
 * `payment` is the receipt from paymentApi; only its label and transaction id are kept.
 */
export const createBooking = ({ user, showId, seatIds, requestId, payment }, { signal } = {}) =>
  respond(() => {
    const bookings = readBookings()

    const repeat = bookings.find((b) => b.requestId === requestId && b.userId === user.id)
    if (repeat) return { booking: repeat, duplicate: true }

    const unique = [...new Set(seatIds)]
    if (!unique.length) throw new MockApiError('Select at least one seat.', 400)
    if (unique.length > MAX_SEATS_PER_BOOKING) {
      throw new MockApiError(`You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.`, 400)
    }

    const data = loadShowSeats(showId) // re-read so we validate against the latest seat map
    if (data.show.status === 'past') throw new MockApiError('This show has already started.', 410)

    const seatsById = new Map(data.seatMap.rows.flatMap((r) => r.blocks.flat()).map((s) => [s.id, s]))
    const unknown = unique.filter((id) => !seatsById.has(id))
    if (unknown.length) throw new MockApiError(`Unknown seat(s): ${unknown.join(', ')}.`, 400)

    const taken = unique.filter((id) => seatsById.get(id).status === 'booked')
    if (taken.length) {
      const err = new MockApiError(
        `Sorry, ${taken.join(', ')} ${taken.length === 1 ? 'was' : 'were'} just booked by someone else. Please choose different seats.`,
        409,
      )
      err.takenSeats = taken
      throw err
    }

    const seats = unique.map((id) => seatsById.get(id))
    const price = priceBreakdown(seats, data.seatMap.tiers)
    const booking = {
      id: generateBookingId(bookings),
      requestId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      showId,
      startsAt: data.show.startsAt,
      showTime: data.show.time,
      format: data.show.format,
      movie: {
        id: data.movie.id,
        title: data.movie.title,
        language: data.movie.original_language,
        poster_path: data.movie.poster_path,
      },
      theatre: data.theatre,
      screen: data.screen,
      seats: price.groups.flatMap((g) => g.seats.map((s) => s.id)),
      lines: price.groups.map((g) => ({ tier: g.tier, price: g.price, count: g.seats.length, subtotal: g.subtotal })),
      tickets: price.tickets,
      fee: price.fee,
      total: price.total,
      payment: payment
        ? { method: payment.method, label: payment.label, transactionId: payment.transactionId, paidAt: payment.paidAt }
        : null,
    }
    writeBookings([...bookings, booking])
    return { booking, duplicate: false }
  }, signal)

export const getBooking = (bookingId, user, { signal } = {}) =>
  respond(() => {
    const booking = readBookings().find((b) => b.id === bookingId && b.userId === user.id)
    if (!booking) throw new MockApiError('We could not find this booking in your account.', 404)
    return booking
  }, signal)

export const getMyBookings = (user, { signal } = {}) =>
  respond(
    () =>
      readBookings()
        .filter((b) => b.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    signal,
  )

/** The user's existing confirmed bookings for a show (to warn before booking again). */
export const findMyBookingsForShow = (user, showId) =>
  readBookings().filter((b) => b.userId === user.id && b.showId === showId && b.status === 'confirmed')
