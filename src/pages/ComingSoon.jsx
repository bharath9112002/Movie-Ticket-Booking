import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

// Placeholder for modules that haven't been built yet (movies, theatres, shows, bookings).
export default function ComingSoon({ title }) {
  return (
    <>
      <Navbar />
      <main className="not-found">
        <h1 className="coming-soon-title">{title}</h1>
        <p>This module is coming soon.</p>
        <Link to="/" className="btn btn-primary">Back to dashboard</Link>
      </main>
    </>
  )
}
