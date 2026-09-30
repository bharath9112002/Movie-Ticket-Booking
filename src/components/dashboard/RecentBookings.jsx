import { Link } from 'react-router-dom'
import { getMovie, getTheatre } from '../../data/dashboardData'
import { formatCurrency, formatDateTime } from '../../utils/format'

const initials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

export default function RecentBookings({ bookings }) {
  return (
    <section className="panel recent-bookings fade-up" style={{ '--i': 10 }}>
      <header className="panel-head">
        <h2>Recent bookings</h2>
        <Link to="/bookings" className="link-sm">View all</Link>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Booking ID</th>
              <th scope="col">Customer</th>
              <th scope="col">Movie</th>
              <th scope="col">Theatre</th>
              <th scope="col" className="num">Seats</th>
              <th scope="col" className="num">Amount</th>
              <th scope="col">Booked</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td data-label="Booking ID" className="mono">{b.id}</td>
                <td data-label="Customer">
                  <span className="customer">
                    <span className="customer-avatar" aria-hidden="true">{initials(b.customer)}</span>
                    {b.customer}
                  </span>
                </td>
                <td data-label="Movie">{getMovie(b.movieId).title}</td>
                <td data-label="Theatre">{getTheatre(b.theatreId).name}</td>
                <td data-label="Seats" className="num">{b.seats}</td>
                <td data-label="Amount" className="num">{formatCurrency(b.amount)}</td>
                <td data-label="Booked">{formatDateTime(b.bookedAt)}</td>
                <td data-label="Status">
                  <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
