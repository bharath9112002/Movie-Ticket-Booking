// Shared block for error / empty states.
export default function StatusMessage({ icon, title, message, action }) {
  return (
    <div className="status-message" role={action ? 'alert' : 'status'}>
      <span className="status-icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
