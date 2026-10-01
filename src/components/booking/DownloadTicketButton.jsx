import { useEffect, useRef, useState } from 'react'

// UI-only: shows a short "preparing" state, then says downloads aren't available yet.
export default function DownloadTicketButton({ bookingId, className = 'btn btn-primary' }) {
  const [state, setState] = useState('idle') // idle | preparing | done
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])

  const start = () => {
    setState('preparing')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setState('done')
      timer.current = setTimeout(() => setState('idle'), 4000)
    }, 1200)
  }

  return (
    <>
      <button type="button" className={className} onClick={start} disabled={state === 'preparing'}>
        {state === 'preparing' ? (
          <>
            <span className="spinner is-small" aria-hidden="true" /> Preparing ticket…
          </>
        ) : (
          <>⬇ Download ticket</>
        )}
      </button>
      <p className={`download-note${state === 'done' ? ' is-visible' : ''}`} role="status">
        {state === 'done' ? `Ticket ${bookingId} — PDF download is coming soon. Use Print ticket for now.` : ''}
      </p>
    </>
  )
}
