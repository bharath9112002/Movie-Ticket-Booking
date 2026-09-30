import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true, state: { message: 'You have been logged out.' } })
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="brand">
          <span className="brand-mark">🎬</span> CineBook
        </div>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
      </div>
      <div className="nav-user">
        <span className="avatar" aria-hidden="true">{initials}</span>
        <span className="nav-name">{user.name}</span>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
