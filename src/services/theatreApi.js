// Offline mock API for theatres, screens and show timings.
// Theatre brands and contact details are fictional; localities are real so maps make sense.
// Show times are generated per theatre and date from a fixed seed, so they are stable
// across reloads but always relative to today.

import { getLocalBookedSeats } from '../utils/bookingStorage'
import { popularMovies } from './mockMovieApi'
import { MockApiError, paginate, respond, seededRandom } from './mockUtils'

export const PAGE_SIZE = 9
export const SHOW_DAYS = 7

const DAY = 24 * 60 * 60 * 1000

const CITIES = {
  Chennai: { state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, std: '44' },
  Bengaluru: { state: 'Karnataka', lat: 12.9716, lng: 77.5946, std: '80' },
  Hyderabad: { state: 'Telangana', lat: 17.385, lng: 78.4867, std: '40' },
  Mumbai: { state: 'Maharashtra', lat: 19.076, lng: 72.8777, std: '22' },
  Kochi: { state: 'Kerala', lat: 9.9312, lng: 76.2673, std: '484' },
  Coimbatore: { state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, std: '422' },
  Delhi: { state: 'Delhi', lat: 28.6139, lng: 77.209, std: '11' },
  Pune: { state: 'Maharashtra', lat: 18.5204, lng: 73.8567, std: '20' },
}

// [brand, locality, pincode, street, city, lat offset, lng offset]
const LOCATIONS = [
  ['Galaxy Cinemas', 'Anna Nagar', '600040', '2nd Avenue, Block W', 'Chennai', 0.0, -0.06],
  ['Starlight Multiplex', 'Velachery', '600042', '100 Feet Bypass Road', 'Chennai', -0.1, -0.05],
  ['Aurora Cinemas', 'T. Nagar', '600017', 'Usman Road', 'Chennai', -0.04, -0.04],
  ['Cineverse', 'Koramangala', '560034', '80 Feet Road, 4th Block', 'Bengaluru', -0.04, 0.03],
  ['Galaxy Cinemas', 'Whitefield', '560066', 'ITPL Main Road', 'Bengaluru', 0.0, 0.16],
  ['Moonbeam Theatres', 'Malleshwaram', '560003', 'Sampige Road', 'Bengaluru', 0.03, -0.02],
  ['Starlight Multiplex', 'Banjara Hills', '500034', 'Road No. 1', 'Hyderabad', 0.03, -0.04],
  ['Cineverse', 'Gachibowli', '500032', 'Old Mumbai Highway', 'Hyderabad', 0.06, -0.14],
  ['Aurora Cinemas', 'Kukatpally', '500072', 'JNTU Road', 'Hyderabad', 0.1, -0.08],
  ['Galaxy Cinemas', 'Andheri West', '400053', 'Link Road', 'Mumbai', 0.06, -0.04],
  ['Moonbeam Theatres', 'Lower Parel', '400013', 'Senapati Bapat Marg', 'Mumbai', -0.08, -0.05],
  ['Starlight Multiplex', 'Powai', '400076', 'Hiranandani Gardens', 'Mumbai', 0.04, 0.03],
  ['Cineverse', 'Edappally', '682024', 'NH 66 Bypass', 'Kochi', 0.1, 0.04],
  ['Aurora Cinemas', 'Kakkanad', '682030', 'Seaport-Airport Road', 'Kochi', 0.08, 0.08],
  ['Moonbeam Theatres', 'MG Road', '682016', 'Ravipuram', 'Kochi', 0.0, 0.02],
  ['Galaxy Cinemas', 'RS Puram', '641002', 'DB Road', 'Coimbatore', 0.0, -0.02],
  ['Starlight Multiplex', 'Peelamedu', '641004', 'Avinashi Road', 'Coimbatore', 0.01, 0.05],
  ['Cineverse', 'Gandhipuram', '641012', 'Cross Cut Road', 'Coimbatore', 0.0, 0.0],
  ['Aurora Cinemas', 'Saket', '110017', 'Press Enclave Marg', 'Delhi', -0.09, 0.0],
  ['Galaxy Cinemas', 'Connaught Place', '110001', 'Outer Circle, Block F', 'Delhi', 0.02, 0.01],
  ['Moonbeam Theatres', 'Dwarka', '110075', 'Sector 12', 'Delhi', -0.02, -0.17],
  ['Starlight Multiplex', 'Koregaon Park', '411001', 'North Main Road', 'Pune', 0.02, 0.04],
  ['Cineverse', 'Viman Nagar', '411014', 'Nagar Road', 'Pune', 0.05, 0.06],
  ['Aurora Cinemas', 'Kothrud', '411038', 'Paud Road', 'Pune', -0.01, -0.05],
]

const SCREEN_TYPES = [
  { type: 'Standard', price: 180, seats: [140, 220] },
  { type: 'Dolby Atmos', price: 250, seats: [180, 260] },
  { type: 'Recliner', price: 420, seats: [60, 90] },
  { type: 'IMAX', price: 480, seats: [280, 340] },
  { type: '4DX', price: 560, seats: [90, 120] },
]

const AMENITIES = ['Parking', 'Food court', 'Wheelchair access', 'M-Ticket', 'Recliner seats', '3D', 'Baby care room', 'Café']

const SLOT_PATTERNS = [
  ['09:15', '12:30', '15:45', '19:00', '22:15'],
  ['10:00', '13:20', '16:40', '20:00'],
  ['11:30', '14:45', '18:10', '21:30'],
  ['08:45', '12:00', '15:15', '18:30', '21:45'],
]

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const THEATRES = LOCATIONS.map(([brand, locality, pincode, street, city, dLat, dLng], i) => {
  const id = 201 + i
  const random = seededRandom(id * 7919)
  const cityInfo = CITIES[city]
  const screenCount = 3 + Math.floor(random() * 6)

  const screens = Array.from({ length: screenCount }, (_, n) => {
    // Screen 1 is always standard; premium formats are spread across the rest.
    const spec = n === 0 ? SCREEN_TYPES[0] : SCREEN_TYPES[Math.floor(random() * SCREEN_TYPES.length)]
    const [minSeats, maxSeats] = spec.seats
    return {
      id: `${id}-s${n + 1}`,
      name: `Screen ${n + 1}`,
      type: spec.type,
      seats: minSeats + Math.floor(random() * (maxSeats - minSeats)),
      basePrice: spec.price,
      status: 'open',
    }
  })

  // Occasionally one screen (never Screen 1) is closed for maintenance.
  if (screenCount > 3 && random() < 0.3) {
    screens[1 + Math.floor(random() * (screenCount - 1))].status = 'maintenance'
  }

  const amenities = AMENITIES.filter(() => random() < 0.6)
  const phoneTail = String(10000 + Math.floor(random() * 89999))

  return {
    id,
    name: `${brand} ${locality}`,
    brand,
    locality,
    address: `${street}, ${locality}, ${city}, ${cityInfo.state} ${pincode}`,
    city,
    state: cityInfo.state,
    pincode,
    lat: +(cityInfo.lat + dLat).toFixed(4),
    lng: +(cityInfo.lng + dLng).toFixed(4),
    phone: `+91 98765 ${phoneTail}`,
    email: `${slug(locality)}@${slug(brand).replace(/-/g, '')}.example`,
    rating: +(3.6 + random() * 1.3).toFixed(1),
    amenities: amenities.length ? amenities : ['M-Ticket'],
    screens,
  }
})

const startOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const toDateKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const fromDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** The bookable dates, today first, as YYYY-MM-DD keys in local time. */
export const upcomingDates = () => {
  const today = startOfDay(new Date())
  return Array.from({ length: SHOW_DAYS }, (_, i) => toDateKey(new Date(today.getTime() + i * DAY)))
}

const NOW_SHOWING = popularMovies(12)

// All shows at one theatre on one date, oldest first.
function generateShows(theatre, dateKey) {
  const date = fromDateKey(dateKey)
  const dayNumber = Math.round(date.getTime() / DAY)
  const random = seededRandom(theatre.id * 100003 + dayNumber)
  const weekend = [0, 6].includes(date.getDay())
  const now = Date.now()

  const shows = []
  theatre.screens
    .filter((s) => s.status === 'open')
    .forEach((screen, index) => {
      const slots = SLOT_PATTERNS[(index + dayNumber) % SLOT_PATTERNS.length]
      // Each screen plays one film for most of the day, with a different late show.
      const mainMovie = NOW_SHOWING[Math.floor(random() * NOW_SHOWING.length)]
      const lateMovie = NOW_SHOWING[Math.floor(random() * NOW_SHOWING.length)]

      slots.forEach((time, slotIndex) => {
        const movie = slotIndex === slots.length - 1 ? lateMovie : mainMovie
        const [h, m] = time.split(':').map(Number)
        const startsAt = new Date(date)
        startsAt.setHours(h, m)

        const evening = h >= 18
        const demand = 0.25 + random() * 0.55 + (evening ? 0.15 : 0) + (weekend ? 0.15 : 0)
        const booked = Math.min(screen.seats, Math.round(screen.seats * demand))
        const id = `${screen.id}-${dateKey}-${time}`
        // `baseAvailable` is the generated figure; real bookings made in this browser come off it.
        const baseAvailable = screen.seats - booked
        const available = Math.max(0, baseAvailable - getLocalBookedSeats(id).size)
        const status =
          startsAt.getTime() < now ? 'past'
            : available === 0 ? 'sold_out'
              : available / screen.seats < 0.2 ? 'filling_fast'
                : 'available'

        shows.push({
          id,
          movieId: movie.id,
          time,
          startsAt: startsAt.toISOString(),
          screenId: screen.id,
          screenName: screen.name,
          format: screen.type,
          price: screen.basePrice + (evening ? 30 : 0) + (weekend ? 20 : 0),
          totalSeats: screen.seats,
          baseAvailable,
          availableSeats: available,
          status,
        })
      })
    })
  return shows.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

const isBookable = (show) => show.status === 'available' || show.status === 'filling_fast'

// Card summary: screen counts and today's remaining shows.
function summarize(theatre) {
  const today = generateShows(theatre, toDateKey(new Date()))
  const bookable = today.filter(isBookable)
  const { screens, ...rest } = theatre
  return {
    ...rest,
    screenCount: screens.length,
    openScreens: screens.filter((s) => s.status === 'open').length,
    screenTypes: [...new Set(screens.map((s) => s.type))],
    availableShowsToday: bookable.length,
    nextShows: bookable.slice(0, 4).map(({ id, time, format, status }) => ({ id, time, format, status })),
  }
}

const matches = (theatre, query) => {
  const q = query.trim().toLowerCase()
  return !q || [theatre.name, theatre.address, theatre.city].some((field) => field.toLowerCase().includes(q))
}

export const getCities = ({ signal } = {}) =>
  respond(
    () =>
      Object.keys(CITIES)
        .map((name) => ({ name, count: THEATRES.filter((t) => t.city === name).length }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    signal,
  )

export const getTheatres = ({ query = '', city = '', page = 1 } = {}, { signal } = {}) =>
  respond(() => {
    const list = THEATRES.filter((t) => (!city || t.city === city) && matches(t, query)).sort(
      (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
    )
    const data = paginate(list, page, PAGE_SIZE)
    return { ...data, results: data.results.map(summarize) }
  }, signal)

export const getTheatre = (id, { signal } = {}) =>
  respond(() => {
    const theatre = THEATRES.find((t) => t.id === Number(id))
    if (!theatre) throw new MockApiError('This theatre could not be found.', 404)
    return { ...summarize(theatre), screens: theatre.screens }
  }, signal)

/** Show timings for one date, grouped by movie. */
export const getShowtimes = (id, dateKey, { signal } = {}) =>
  respond(() => {
    const theatre = THEATRES.find((t) => t.id === Number(id))
    if (!theatre) throw new MockApiError('This theatre could not be found.', 404)
    if (!upcomingDates().includes(dateKey)) {
      throw new MockApiError(`Show timings are only available for the next ${SHOW_DAYS} days.`, 400)
    }
    const groups = new Map()
    generateShows(theatre, dateKey).forEach((show) => {
      if (!groups.has(show.movieId)) {
        groups.set(show.movieId, { movie: NOW_SHOWING.find((m) => m.id === show.movieId), shows: [] })
      }
      groups.get(show.movieId).shows.push(show)
    })
    return [...groups.values()].sort((a, b) => b.movie.popularity - a.movie.popularity)
  }, signal)

// ---------- Seat layouts ----------

export const MAX_SEATS_PER_BOOKING = 10

// Seat tiers per screen format, back rows first. `share` is the fraction of rows;
// `delta` is added to the show's base price.
const TIER_PLANS = {
  Recliner: [{ name: 'Recliner', share: 1, delta: 0 }],
  IMAX: [
    { name: 'Premium', share: 0.35, delta: 80 },
    { name: 'Standard', share: 0.65, delta: 0 },
  ],
  '4DX': [
    { name: 'Motion Premium', share: 0.4, delta: 60 },
    { name: 'Motion', share: 0.6, delta: 0 },
  ],
  default: [
    { name: 'Royal Recliner', share: 0.15, delta: 150 },
    { name: 'Prime', share: 0.5, delta: 0 },
    { name: 'Classic', share: 0.35, delta: -40 },
  ],
}

// Seats per row, split into blocks separated by aisles.
function blockLayout(totalSeats, type) {
  if (type === 'Recliner') return [4, 6, 4]
  if (totalSeats > 250) return [5, 12, 5]
  if (totalSeats > 150) return [4, 10, 4]
  if (totalSeats > 100) return [3, 8, 3]
  return [3, 6, 3]
}

const hashString = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)

function buildSeatMap(show) {
  const blocks = blockLayout(show.totalSeats, show.format)
  const perRow = blocks.reduce((a, b) => a + b, 0)
  const rowCount = Math.ceil(show.totalSeats / perRow)
  const plan = TIER_PLANS[show.format] ?? TIER_PLANS.default

  // Rows are labelled from the screen: A is the front row. Back (premium) rows come first here.
  const tierForRow = []
  plan.forEach((tier, i) => {
    const count = i === plan.length - 1 ? rowCount - tierForRow.length : Math.max(1, Math.round(rowCount * tier.share))
    for (let n = 0; n < count && tierForRow.length < rowCount; n++) tierForRow.push(tier)
  })

  const tiers = plan.map((t) => ({ name: t.name, price: Math.max(100, show.price + t.delta) }))
  const priceOf = (tier) => tiers.find((t) => t.name === tier.name).price

  const rows = []
  let remaining = show.totalSeats
  for (let r = 0; r < rowCount; r++) {
    const label = String.fromCharCode(65 + (rowCount - 1 - r)) // back row gets the last letter
    const tier = tierForRow[r]
    const seatsInRow = Math.min(perRow, remaining)
    remaining -= seatsInRow
    // A short front row is centred: trim the outer blocks, or use only the centre block.
    const trim = perRow - seatsInRow
    const outer = Math.min(blocks[0], blocks[blocks.length - 1])
    const rowBlocks =
      trim <= outer * 2
        ? blocks.map((size, b) =>
            b === 0 ? size - Math.floor(trim / 2) : b === blocks.length - 1 ? size - Math.ceil(trim / 2) : size,
          )
        : blocks.map((_, b) => (b === 1 ? seatsInRow : 0))
    let number = 0
    rows.push({
      label,
      tier: tier.name,
      blocks: rowBlocks.map((size) =>
        Array.from({ length: Math.max(0, size) }, () => {
          number += 1
          return { id: `${label}${number}`, row: label, number, tier: tier.name, price: priceOf(tier), status: 'available' }
        }),
      ),
    })
  }

  // Mark the generated bookings (the same seats every time for this show), then the
  // real ones made in this browser.
  const seats = rows.flatMap((row) => row.blocks.flat())
  const random = seededRandom(hashString(show.id))
  const order = seats.map((seat, i) => ({ i, key: random() })).sort((a, b) => a.key - b.key)
  const bookedCount = show.totalSeats - show.baseAvailable
  order.slice(0, bookedCount).forEach(({ i }) => {
    seats[i].status = 'booked'
  })
  const local = getLocalBookedSeats(show.id)
  seats.forEach((seat) => {
    if (local.has(seat.id)) seat.status = 'booked'
  })

  return { tiers, rows }
}

const SHOW_ID = /^(\d+)-s(\d+)-(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2})$/

/** One show with its theatre, movie and full seat map (synchronous; throws MockApiError). */
export function loadShowSeats(showId) {
  const match = SHOW_ID.exec(showId)
  const theatre = match && THEATRES.find((t) => t.id === Number(match[1]))
  if (!theatre) throw new MockApiError('This show could not be found.', 404)
  if (!upcomingDates().includes(match[3])) {
    throw new MockApiError('Seat selection is only available for shows in the next 7 days.', 404)
  }
  const show = generateShows(theatre, match[3]).find((s) => s.id === showId)
  if (!show) throw new MockApiError('This show could not be found.', 404)

  const screen = theatre.screens.find((s) => s.id === show.screenId)
  return {
    show,
    theatre: { id: theatre.id, name: theatre.name, address: theatre.address, city: theatre.city },
    screen: { id: screen.id, name: screen.name, type: screen.type },
    movie: NOW_SHOWING.find((m) => m.id === show.movieId),
    seatMap: buildSeatMap(show),
  }
}

export const getShowSeats = (showId, { signal } = {}) => respond(() => loadShowSeats(showId), signal)

// ---------- Booking flow lookups ----------

/** Resolves and cross-checks the wizard's current choices. */
export const getBookingContext = ({ movie, theatre, show }, { signal } = {}) =>
  respond(() => {
    const m = movie ? NOW_SHOWING.find((x) => x.id === Number(movie)) : null
    if (movie && !m) throw new MockApiError('This movie is not currently showing in any theatre.', 404)
    const t = theatre ? THEATRES.find((x) => x.id === Number(theatre)) : null
    if (theatre && !t) throw new MockApiError('This theatre could not be found.', 404)
    let s = null
    if (show) {
      const data = loadShowSeats(show)
      if ((m && data.show.movieId !== m.id) || (t && data.theatre.id !== t.id)) {
        throw new MockApiError("That show doesn't match the movie and theatre you picked.", 400)
      }
      s = data.show
    }
    return {
      movie: m,
      theatre: t && { id: t.id, name: t.name, address: t.address, city: t.city },
      show: s,
    }
  }, signal)

// Every show of one movie across all theatres and bookable dates.
function showsOfMovie(movieId) {
  const dates = upcomingDates()
  return THEATRES.flatMap((theatre) =>
    dates.flatMap((date) =>
      generateShows(theatre, date)
        .filter((s) => s.movieId === movieId && isBookable(s))
        .map((s) => ({ ...s, theatreId: theatre.id })),
    ),
  )
}

/** Movies currently playing, with how many theatres and shows have seats. */
export const getNowShowing = ({ signal } = {}) =>
  respond(
    () =>
      NOW_SHOWING.map((movie) => {
        const shows = showsOfMovie(movie.id)
        return { ...movie, theatreCount: new Set(shows.map((s) => s.theatreId)).size, showCount: shows.length }
      }).filter((m) => m.showCount > 0),
    signal,
  )

/** Theatres screening a movie in the next few days, with show counts and the next show. */
export const getTheatresForMovie = (movieId, { signal } = {}) =>
  respond(() => {
    const id = Number(movieId)
    if (!NOW_SHOWING.some((m) => m.id === id)) throw new MockApiError('This movie is not playing in any theatre.', 404)
    const shows = showsOfMovie(id)
    return THEATRES.map((theatre) => {
      const own = shows.filter((s) => s.theatreId === theatre.id)
      if (!own.length) return null
      const { screens: _screens, ...info } = theatre
      return {
        ...info,
        showCount: own.length,
        formats: [...new Set(own.map((s) => s.format))],
        nextShow: own[0],
      }
    })
      .filter(Boolean)
      .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
  }, signal)

export const mapEmbedUrl = ({ lat, lng }) => {
  const d = 0.01
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d * 0.6},${lng + d},${lat + d * 0.6}&layer=mapnik&marker=${lat},${lng}`
}

export const directionsUrl = ({ lat, lng }) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
