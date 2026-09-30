import { useEffect, useRef } from 'react'
import { backdropLayers } from '../../services/tmdb'

// UI-only trailer player: shows the frame and controls, no actual playback yet.
export default function TrailerModal({ movie, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  const backdrop = backdropLayers(movie, 'w780')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="trailer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trailer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="trailer-head">
          <h2 id="trailer-title">{movie.title} — Trailer</h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Close trailer">
            ✕
          </button>
        </header>
        <div
          className="trailer-screen"
          style={backdrop ? { backgroundImage: backdrop } : undefined}
        >
          <span className="trailer-play" aria-hidden="true">▶</span>
          <p>Trailer playback is coming soon.</p>
        </div>
      </div>
    </div>
  )
}
