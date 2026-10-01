// The booking wizard keeps every choice in the URL (/book?movie=&theatre=&date=&show=&seats=&pay=1),
// so refreshes, back/forward and shared links all land on the right step.

export const BOOKING_STEPS = [
  { key: 'movie', label: 'Movie' },
  { key: 'theatre', label: 'Theatre' },
  { key: 'show', label: 'Show time' },
  { key: 'seats', label: 'Seats' },
  { key: 'summary', label: 'Summary' },
  { key: 'payment', label: 'Payment' },
]

// Params that belong to each step; choosing again on a step clears everything after it.
const STEP_PARAMS = { movie: ['movie'], theatre: ['theatre'], show: ['date', 'show'], seats: ['seats'] }

export function readBookingParams(params) {
  const list = (name) => (params.get(name) ?? '').split(',').filter(Boolean)
  const seats = list('seats')
  return {
    movie: params.get('movie') ?? '',
    theatre: params.get('theatre') ?? '',
    date: params.get('date') ?? '',
    show: params.get('show') ?? '',
    seats,
    // Seats to preselect when returning to the seat map from the summary.
    pick: list('pick'),
    // Set once the summary is reviewed and the user moves on to pay.
    pay: params.get('pay') === '1',
  }
}

export function currentStep({ movie, theatre, show, seats, pay }) {
  if (!movie) return 'movie'
  if (!theatre) return 'theatre'
  if (!show) return 'show'
  if (!seats.length) return 'seats'
  return pay ? 'payment' : 'summary'
}

export function bookingUrl({ movie, theatre, date, show, seats, pick, pay } = {}) {
  const params = new URLSearchParams()
  if (movie) params.set('movie', movie)
  if (theatre) params.set('theatre', theatre)
  if (date) params.set('date', date)
  if (show) params.set('show', show)
  if (seats?.length) params.set('seats', seats.join(','))
  if (pick?.length) params.set('pick', pick.join(','))
  if (pay) params.set('pay', '1')
  const query = params.toString()
  return query ? `/book?${query}` : '/book'
}

/** URL for going back to `step`, keeping earlier choices and dropping later ones. */
export function urlForStep(state, step) {
  const order = BOOKING_STEPS.map((s) => s.key)
  const keep = {}
  order.slice(0, order.indexOf(step)).forEach((key) => {
    STEP_PARAMS[key]?.forEach((param) => {
      keep[param] = state[param]
    })
  })
  // Keep the chosen seats when returning to the seat map so they're preselected.
  if (step === 'seats') keep.pick = state.seats.length ? state.seats : state.pick
  if (step === 'payment') keep.pay = true
  return bookingUrl(keep)
}

/** Show ids look like "201-s1-2026-10-01-19:00": theatre id and date are embedded. */
export function parseShowId(showId) {
  const m = /^(\d+)-s\d+-(\d{4}-\d{2}-\d{2})-\d{2}:\d{2}$/.exec(showId)
  return m ? { theatre: m[1], date: m[2] } : null
}

// One request id per (show, seats) choice, kept for the browser session. Re-submitting the
// same choice — double click, refresh, back button — reuses it, so the booking service
// returns the booking already made instead of creating a duplicate.
export function requestIdFor(showId, seats) {
  const key = `mtb_booking_request:${showId}:${[...seats].sort().join(',')}`
  try {
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
