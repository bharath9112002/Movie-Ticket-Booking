import { Link, useNavigate } from 'react-router-dom'
import StepError from './StepError'
import SeatPicker from '../seats/SeatPicker'
import useAsync from '../../hooks/useAsync'
import { getShowSeats } from '../../services/theatreApi'
import { bookingUrl, urlForStep } from '../../utils/bookingFlow'

export default function SeatStep({ state }) {
  const navigate = useNavigate()
  const seats = useAsync((signal) => getShowSeats(state.show, { signal }), state.show)

  if (seats.status === 'loading') {
    return (
      <div className="seat-panel skeleton" aria-busy="true" aria-label="Loading seat layout">
        <div className="seat-skeleton-grid">
          {Array.from({ length: 96 }, (_, i) => (
            <span key={i} className="shimmer" />
          ))}
        </div>
      </div>
    )
  }
  if (seats.status === 'error') {
    return (
      <StepError
        error={seats.error}
        onRetry={seats.reload}
        back={<Link to={urlForStep(state, 'show')} className="btn btn-outline">Choose another show</Link>}
      />
    )
  }
  if (seats.data.show.status === 'past') {
    return (
      <StepError
        error={{ status: 410, message: 'This show has already started. Please pick another show time.' }}
        back={<Link to={urlForStep(state, 'show')} className="btn btn-primary">Choose another show</Link>}
      />
    )
  }

  return (
    <SeatPicker
      key={state.show}
      data={seats.data}
      initialSelected={state.pick}
      onProceed={(chosen) => navigate(bookingUrl({ ...state, pick: [], seats: chosen }))}
    />
  )
}
