// Dummy data for the dashboard. Generated from a fixed seed so numbers are
// stable across reloads, but dates are relative to "now" so today's figures
// and upcoming releases always make sense.

const DAY = 24 * 60 * 60 * 1000

// Small deterministic PRNG (mulberry32).
function createRandom(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(20260930)
const pick = (list) => list[Math.floor(random() * list.length)]
const randInt = (min, max) => min + Math.floor(random() * (max - min + 1))

export const startOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const now = new Date()
const today = startOfDay(now)
const daysFromToday = (n) => new Date(today.getTime() + n * DAY)

export const movies = [
  { id: 'm1', title: 'Leo: Bloody Sweet', genre: 'Action', language: 'Tamil', duration: 164, status: 'now_showing', releaseDate: daysFromToday(-20) },
  { id: 'm2', title: 'The Last Horizon', genre: 'Sci-Fi', language: 'English', duration: 142, status: 'now_showing', releaseDate: daysFromToday(-12) },
  { id: 'm3', title: 'Kaatru Veliyidai', genre: 'Romance', language: 'Tamil', duration: 138, status: 'now_showing', releaseDate: daysFromToday(-9) },
  { id: 'm4', title: 'Midnight Circuit', genre: 'Thriller', language: 'Hindi', duration: 127, status: 'now_showing', releaseDate: daysFromToday(-5) },
  { id: 'm5', title: 'Little Big Paws', genre: 'Animation', language: 'English', duration: 98, status: 'now_showing', releaseDate: daysFromToday(-2) },
  { id: 'm6', title: 'Vettaiyan Returns', genre: 'Action', language: 'Tamil', duration: 158, status: 'upcoming', releaseDate: daysFromToday(3) },
  { id: 'm7', title: 'Echoes of Monsoon', genre: 'Drama', language: 'Malayalam', duration: 131, status: 'upcoming', releaseDate: daysFromToday(8) },
  { id: 'm8', title: 'Quantum Heist', genre: 'Sci-Fi', language: 'English', duration: 149, status: 'upcoming', releaseDate: daysFromToday(15) },
  { id: 'm9', title: 'Rang De Dosti', genre: 'Comedy', language: 'Hindi', duration: 124, status: 'upcoming', releaseDate: daysFromToday(22) },
]

export const theatres = [
  { id: 't1', name: 'PVR Grand Galada', city: 'Chennai', screens: 6, ticketPrice: 220 },
  { id: 't2', name: 'INOX Phoenix', city: 'Chennai', screens: 8, ticketPrice: 250 },
  { id: 't3', name: 'Sathyam Cinemas', city: 'Chennai', screens: 6, ticketPrice: 190 },
  { id: 't4', name: 'Cinepolis Nexus', city: 'Bengaluru', screens: 7, ticketPrice: 280 },
  { id: 't5', name: 'AGS Cinemas', city: 'Coimbatore', screens: 4, ticketPrice: 160 },
]

const SHOW_TIMES = ['10:00', '13:30', '17:00', '21:00']
const SEATS_PER_SHOW = 120

// Shows for today and the next two days, for every movie currently showing.
export const shows = []
movies
  .filter((m) => m.status === 'now_showing')
  .forEach((movie) => {
    for (let day = 0; day < 3; day++) {
      theatres.forEach((theatre) => {
        if (random() < 0.45) return // not every theatre screens every movie
        SHOW_TIMES.forEach((time) => {
          const [h, min] = time.split(':').map(Number)
          const startsAt = daysFromToday(day)
          startsAt.setHours(h, min)
          shows.push({
            id: `s${shows.length + 1}`,
            movieId: movie.id,
            theatreId: theatre.id,
            startsAt,
            totalSeats: SEATS_PER_SHOW,
            // Sooner shows are fuller; some are sold out.
            bookedSeats: Math.min(SEATS_PER_SHOW, randInt(20, 130 - day * 30)),
          })
        })
      })
    }
  })

const CUSTOMERS = [
  'Arjun Kumar', 'Priya Sharma', 'Karthik Raja', 'Divya Menon', 'Rahul Verma',
  'Sneha Iyer', 'Vikram Singh', 'Ananya Rao', 'Mohammed Imran', 'Lakshmi Narayan',
  'Rohan Das', 'Meera Pillai', 'Suresh Babu', 'Kavya Reddy', 'Aditya Joshi',
]

const BOOKING_COUNT = 180

// Bookings over the last 30 days. The first few are forced into today so the
// "today" figures are never empty.
const msSinceMidnight = now.getTime() - today.getTime()
export const bookings = Array.from({ length: BOOKING_COUNT }, (_, i) => {
  const ageMs =
    i < 8
      ? random() * Math.min(msSinceMidnight, 6 * 60 * 60 * 1000)
      : random() * 30 * DAY
  const movie = pick(movies.filter((m) => m.status === 'now_showing'))
  const theatre = pick(theatres)
  const seats = randInt(1, 5)
  const roll = random()
  return {
    id: `BK${String(10240 + i)}`,
    customer: pick(CUSTOMERS),
    movieId: movie.id,
    theatreId: theatre.id,
    seats,
    amount: seats * theatre.ticketPrice,
    status: roll < 0.84 ? 'Confirmed' : roll < 0.94 ? 'Pending' : 'Cancelled',
    bookedAt: new Date(now.getTime() - ageMs),
  }
}).sort((a, b) => b.bookedAt - a.bookedAt)

export const getMovie = (id) => movies.find((m) => m.id === id)
export const getTheatre = (id) => theatres.find((t) => t.id === id)
