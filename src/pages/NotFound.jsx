import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>404</h1>
      <p>This page doesn&apos;t exist.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </main>
  )
}
