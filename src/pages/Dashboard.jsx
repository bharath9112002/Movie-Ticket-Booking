import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatCard from '../components/dashboard/StatCard'
import NowShowing from '../components/dashboard/NowShowing'
import RevenueSummary from '../components/dashboard/RevenueSummary'
import RecentBookings from '../components/dashboard/RecentBookings'
import UpcomingMovies from '../components/dashboard/UpcomingMovies'
import QuickActions from '../components/dashboard/QuickActions'
import { useAuth } from '../context/AuthContext'
import { movies, theatres, shows, bookings, startOfDay } from '../data/dashboardData'
import { formatCurrency, formatNumber } from '../utils/format'
import './Dashboard.css'

const DAY = 24 * 60 * 60 * 1000
const RECENT_LIMIT = 6

const percentChange = (current, previous) =>
  previous ? Math.round(((current - previous) / previous) * 100) : 0

const trendVsYesterday = (current, previous) => {
  const value = percentChange(current, previous)
  return { value, label: `${value >= 0 ? 'up' : 'down'} vs yesterday` }
}

const greetingFor = (date) => {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function computeStats() {
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = new Date(today.getTime() - DAY)
  const tomorrow = new Date(today.getTime() + DAY)
  const paid = bookings.filter((b) => b.status !== 'Cancelled')
  const sumSince = (from) =>
    paid.filter((b) => b.bookedAt >= from).reduce((sum, b) => sum + b.amount, 0)

  const todaysBookings = bookings.filter((b) => b.bookedAt >= today)
  // Compare today so far against the same stretch of time yesterday.
  const yesterdaySoFar = bookings.filter(
    (b) => b.bookedAt >= yesterday && b.bookedAt < new Date(now.getTime() - DAY),
  )
  const availableShows = shows.filter((s) => s.startsAt > now && s.bookedSeats < s.totalSeats)
  const availableToday = availableShows.filter((s) => s.startsAt < tomorrow)

  const revenueDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today.getTime() - (6 - i) * DAY)
    const next = new Date(date.getTime() + DAY)
    const revenue = paid
      .filter((b) => b.bookedAt >= date && b.bookedAt < next)
      .reduce((sum, b) => sum + b.amount, 0)
    return { date, revenue }
  })

  const nowShowing = movies
    .filter((m) => m.status === 'now_showing')
    .map((m) => {
      const todays = shows.filter((s) => s.movieId === m.id && s.startsAt >= today && s.startsAt < tomorrow)
      const seats = todays.reduce((sum, s) => sum + s.totalSeats, 0)
      const booked = todays.reduce((sum, s) => sum + s.bookedSeats, 0)
      return { ...m, showsToday: todays.length, occupancy: seats ? Math.round((booked / seats) * 100) : 0 }
    })
    .sort((a, b) => b.occupancy - a.occupancy)

  return {
    greeting: greetingFor(now),
    todayLabel: now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
    nowShowing,
    upcoming: movies
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => a.releaseDate - b.releaseDate),
    screens: theatres.reduce((sum, t) => sum + t.screens, 0),
    cities: new Set(theatres.map((t) => t.city)).size,
    confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
    todaysBookings,
    todaysTickets: todaysBookings.reduce((sum, b) => sum + b.seats, 0),
    bookingsTrend: trendVsYesterday(todaysBookings.length, yesterdaySoFar.length),
    availableShows: availableShows.length,
    availableToday: availableToday.length,
    revenueDays,
    revenueTrend: trendVsYesterday(revenueDays[6].revenue, revenueDays[5].revenue),
    revenue: {
      today: sumSince(today),
      week: sumSince(new Date(today.getTime() - 6 * DAY)),
      month: sumSince(new Date(today.getTime() - 29 * DAY)),
      average: paid.length ? Math.round(sumSince(0) / paid.length) : 0,
    },
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const stats = useMemo(() => computeStats(), [])

  const cards = [
    { icon: '🎬', label: 'Total movies', value: movies.length, hint: `${stats.nowShowing.length} now showing`, tone: 'accent' },
    { icon: '🏛️', label: 'Total theatres', value: theatres.length, hint: `${stats.screens} screens · ${stats.cities} cities`, tone: 'blue' },
    { icon: '🎟️', label: 'Total bookings', value: formatNumber(bookings.length), hint: `${stats.confirmed} confirmed`, tone: 'violet' },
    { icon: '⏰', label: 'Available shows', value: stats.availableShows, hint: `${stats.availableToday} still today`, tone: 'green' },
    { icon: '📅', label: "Today's bookings", value: stats.todaysBookings.length, hint: `${stats.todaysTickets} tickets sold`, trend: stats.bookingsTrend, tone: 'amber' },
    { icon: '💰', label: "Today's revenue", value: formatCurrency(stats.revenue.today), hint: 'Excludes cancellations', trend: stats.revenueTrend, tone: 'teal' },
  ]

  return (
    <>
      <Navbar />
      <main className="dashboard">
        <section className="hero fade-up">
          <div className="hero-text">
            <span className="hero-date">📅 {stats.todayLabel}</span>
            <h1>
              {stats.greeting}, <span className="hero-name">{user.name.split(' ')[0]}</span>
            </h1>
            <p>
              {stats.todaysBookings.length} bookings so far today, and {stats.availableToday} shows
              still open for booking.
            </p>
            <div className="hero-actions">
              <Link to="/shows/new" className="btn btn-primary">+ Schedule show</Link>
              <Link to="/bookings" className="btn btn-glass">View bookings</Link>
            </div>
          </div>
          <div className="hero-highlight" aria-label="This week's revenue">
            <span className="hero-highlight-label">Revenue · last 7 days</span>
            <span className="hero-highlight-value">{formatCurrency(stats.revenue.week)}</span>
            <span className="hero-highlight-sub">
              {formatCurrency(stats.revenue.month)} in the last 30 days
            </span>
          </div>
        </section>

        <section className="stat-grid" aria-label="Key figures">
          {cards.map((c, i) => (
            <StatCard key={c.label} index={i + 1} {...c} />
          ))}
        </section>

        <QuickActions />

        <NowShowing movies={stats.nowShowing} />

        <div className="dash-columns">
          <RevenueSummary days={stats.revenueDays} totals={stats.revenue} />
          <UpcomingMovies movies={stats.upcoming} />
        </div>

        <RecentBookings bookings={bookings.slice(0, RECENT_LIMIT)} />
      </main>
    </>
  )
}
