import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetail from './pages/MovieDetail'
import Theatres from './pages/Theatres'
import TheatreDetail from './pages/TheatreDetail'
import SeatSelection from './pages/SeatSelection'
import BookTickets from './pages/BookTickets'
import BookingConfirmation from './pages/BookingConfirmation'
import MyBookings from './pages/MyBookings'
import Reports from './pages/Reports'
import ComingSoon from './pages/ComingSoon'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/new" element={<ComingSoon title="Add movie" />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/theatres" element={<Theatres />} />
            <Route path="/theatres/new" element={<ComingSoon title="Add theatre" />} />
            <Route path="/theatres/:id" element={<TheatreDetail />} />
            <Route path="/shows/:showId/seats" element={<SeatSelection />} />
            <Route path="/shows/*" element={<ComingSoon title="Shows" />} />
            <Route path="/book" element={<BookTickets />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/bookings/:bookingId" element={<BookingConfirmation />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
