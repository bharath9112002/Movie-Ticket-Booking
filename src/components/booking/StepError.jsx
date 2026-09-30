import StatusMessage from '../common/StatusMessage'

// Error block for a wizard step, with retry (for transient errors) and an optional way back.
export default function StepError({ error, onRetry, back }) {
  const permanent = error.status && error.status < 500
  return (
    <StatusMessage
      icon={permanent ? '🎞️' : '⚠️'}
      title={permanent ? "That selection isn't available" : 'Something went wrong'}
      message={error.message}
      action={
        <div className="status-actions">
          {!permanent && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Try again
            </button>
          )}
          {back}
        </div>
      }
    />
  )
}
