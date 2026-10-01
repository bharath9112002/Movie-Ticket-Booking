import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BookingSteps from '../components/booking/BookingSteps'
import MovieStep from '../components/booking/MovieStep'
import PaymentStep from '../components/booking/PaymentStep'
import SeatStep from '../components/booking/SeatStep'
import ShowStep from '../components/booking/ShowStep'
import StepError from '../components/booking/StepError'
import SummaryStep from '../components/booking/SummaryStep'
import TheatreStep from '../components/booking/TheatreStep'
import useAsync from '../hooks/useAsync'
import { getBookingContext } from '../services/theatreApi'
import { currentStep, readBookingParams, urlForStep } from '../utils/bookingFlow'
import { formatShowTime } from '../utils/format'
import '../styles/listing.css'
import './Theatres.css'
import './SeatSelection.css'
import './Movies.css'
import './Booking.css'
import './Payment.css'

const STEP_COMPONENTS = {
  movie: MovieStep,
  theatre: TheatreStep,
  show: ShowStep,
  seats: SeatStep,
  summary: SummaryStep,
  payment: PaymentStep,
}

// Chips summarising the choices so far; each links back to change it.
function SelectionBar({ state, context }) {
  const { movie, theatre, show } = context
  if (!movie) return null
  const chips = [
    { step: 'movie', label: 'Movie', value: movie.title },
    theatre && { step: 'theatre', label: 'Theatre', value: theatre.name },
    show && {
      step: 'show',
      label: 'Show',
      value: `${new Date(show.startsAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatShowTime(show.time)} · ${show.format}`,
    },
  ].filter(Boolean)

  return (
    <ul className="selection-bar" aria-label="Your selection">
      {chips.map((c) => (
        <li key={c.step}>
          <span className="selection-label">{c.label}</span>
          <span className="selection-value">{c.value}</span>
          <Link to={urlForStep(state, c.step)} className="selection-change" aria-label={`Change ${c.label.toLowerCase()}`}>
            Change
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function BookTickets() {
  const [params] = useSearchParams()
  const state = readBookingParams(params)
  const step = currentStep(state)
  const Step = STEP_COMPONENTS[step]

  const context = useAsync(
    (signal) => getBookingContext({ movie: state.movie, theatre: state.theatre, show: state.show }, { signal }),
    `${state.movie}|${state.theatre}|${state.show}`,
  )

  return (
    <>
      <Navbar />
      <main className="booking-page">
        <header className="booking-header">
          <h1>Book tickets</h1>
          <BookingSteps state={state} current={step} />
        </header>

        {context.status === 'error' ? (
          <StepError
            error={context.error}
            onRetry={context.reload}
            back={<Link to="/book" className="btn btn-outline">Start over</Link>}
          />
        ) : (
          <>
            {context.status === 'success' && <SelectionBar state={state} context={context.data} />}
            <Step state={state} />
          </>
        )}
      </main>
    </>
  )
}
