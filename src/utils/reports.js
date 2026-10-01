// Aggregations for the Reports & Analytics page, computed from the dummy dashboard data.

import { bookings, getMovie, getTheatre, movies, shows, startOfDay, theatres } from '../data/dashboardData'

const DAY = 24 * 60 * 60 * 1000

export const REPORT_RANGES = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
]
// The dummy data covers the last 30 days, so longer ranges have no earlier period to compare with.
const DATA_DAYS = 30

const isPaid = (b) => b.status !== 'Cancelled'
const sum = (list, fn) => list.reduce((total, x) => total + fn(x), 0)

function totals(list) {
  const paid = list.filter(isPaid)
  const revenue = sum(paid, (b) => b.amount)
  return {
    bookings: list.length,
    revenue,
    tickets: sum(paid, (b) => b.seats),
    avgValue: paid.length ? Math.round(revenue / paid.length) : 0,
    cancelled: list.filter((b) => b.status === 'Cancelled').length,
  }
}

const percentChange = (current, previous) => (previous ? Math.round(((current - previous) / previous) * 100) : null)

/** Paid bookings grouped by `keyOf`, ranked by tickets sold. */
function rankBy(list, keyOf, nameOf) {
  const groups = new Map()
  list.filter(isPaid).forEach((b) => {
    const key = keyOf(b)
    const g = groups.get(key) ?? { key, name: nameOf(key), bookings: 0, tickets: 0, revenue: 0 }
    g.bookings += 1
    g.tickets += b.seats
    g.revenue += b.amount
    groups.set(key, g)
  })
  return [...groups.values()].sort((a, b) => b.tickets - a.tickets || b.revenue - a.revenue)
}

function occupancy(showList) {
  const seats = sum(showList, (s) => s.totalSeats)
  const booked = sum(showList, (s) => s.bookedSeats)
  return { seats, booked, rate: seats ? Math.round((booked / seats) * 100) : 0, shows: showList.length }
}

export function computeReport(rangeDays, now = new Date()) {
  const today = startOfDay(now)
  const from = new Date(today.getTime() - (rangeDays - 1) * DAY)
  const prevFrom = new Date(from.getTime() - rangeDays * DAY)
  const inRange = bookings.filter((b) => b.bookedAt >= from)
  const previous = rangeDays * 2 <= DATA_DAYS ? bookings.filter((b) => b.bookedAt >= prevFrom && b.bookedAt < from) : null

  const current = totals(inRange)
  const prev = previous && totals(previous)
  const change = (key) => (prev ? percentChange(current[key], prev[key]) : null)

  const daily = Array.from({ length: rangeDays }, (_, i) => {
    const date = new Date(from.getTime() + i * DAY)
    const next = new Date(date.getTime() + DAY)
    const day = inRange.filter((b) => b.bookedAt >= date && b.bookedAt < next)
    const paid = day.filter(isPaid)
    return { date, bookings: day.length, tickets: sum(paid, (b) => b.seats), revenue: sum(paid, (b) => b.amount) }
  })

  const byMovie = rankBy(inRange, (b) => b.movieId, (id) => getMovie(id).title)
  const byTheatre = rankBy(inRange, (b) => b.theatreId, (id) => getTheatre(id).name)

  const occupancyByTheatre = theatres
    .map((t) => ({ key: t.id, name: t.name, city: t.city, ...occupancy(shows.filter((s) => s.theatreId === t.id)) }))
    .filter((t) => t.shows)
    .sort((a, b) => b.rate - a.rate)
  const occupancyByMovie = movies
    .filter((m) => m.status === 'now_showing')
    .map((m) => ({ key: m.id, name: m.title, ...occupancy(shows.filter((s) => s.movieId === m.id)) }))
    .filter((m) => m.shows)
    .sort((a, b) => b.rate - a.rate)

  const statusCounts = ['Confirmed', 'Pending', 'Cancelled'].map((status) => ({
    status,
    count: inRange.filter((b) => b.status === status).length,
  }))

  return {
    from,
    to: now,
    comparable: Boolean(prev),
    totals: current,
    change: {
      bookings: change('bookings'),
      revenue: change('revenue'),
      tickets: change('tickets'),
      avgValue: change('avgValue'),
    },
    daily,
    byMovie,
    byTheatre,
    topMovie: byMovie[0] ?? null,
    topTheatre: byTheatre[0] ?? null,
    occupancy: { ...occupancy(shows), byTheatre: occupancyByTheatre, byMovie: occupancyByMovie },
    statusCounts,
  }
}
