import { Link } from 'react-router-dom'
import { BOOKING_STEPS, urlForStep } from '../../utils/bookingFlow'

export default function BookingSteps({ state, current }) {
  const currentIndex = BOOKING_STEPS.findIndex((s) => s.key === current)

  return (
    <nav className="booking-steps" aria-label="Booking progress">
      <ol>
        {BOOKING_STEPS.map((step, i) => {
          const status = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
          const content = (
            <>
              <span className="step-dot" aria-hidden="true">{status === 'done' ? '✓' : i + 1}</span>
              <span className="step-label">{step.label}</span>
            </>
          )
          return (
            <li key={step.key} className={`step is-${status}`}>
              {status === 'done' ? (
                <Link to={urlForStep(state, step.key)} aria-label={`${step.label} (completed) — change`}>
                  {content}
                </Link>
              ) : (
                <span aria-current={status === 'current' ? 'step' : undefined}>{content}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
