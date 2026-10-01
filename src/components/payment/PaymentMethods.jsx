import { useRef } from 'react'
import { PAYMENT_METHODS, methodPanelId, methodTabId } from '../../utils/payment'

// Tabs for choosing how to pay; arrow keys move between methods (WAI-ARIA tabs pattern).
export default function PaymentMethods({ value, onChange, disabled }) {
  const tabs = useRef({})

  const onKeyDown = (e) => {
    const keys = PAYMENT_METHODS.map((m) => m.key)
    const i = keys.indexOf(value)
    const next = {
      ArrowDown: keys[(i + 1) % keys.length],
      ArrowRight: keys[(i + 1) % keys.length],
      ArrowUp: keys[(i - 1 + keys.length) % keys.length],
      ArrowLeft: keys[(i - 1 + keys.length) % keys.length],
      Home: keys[0],
      End: keys[keys.length - 1],
    }[e.key]
    if (!next) return
    e.preventDefault()
    onChange(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="pay-methods" role="tablist" aria-label="Payment methods" aria-orientation="vertical" onKeyDown={onKeyDown}>
      {PAYMENT_METHODS.map((m) => {
        const selected = m.key === value
        return (
          <button
            key={m.key}
            ref={(el) => {
              tabs.current[m.key] = el
            }}
            type="button"
            role="tab"
            id={methodTabId(m.key)}
            aria-selected={selected}
            aria-controls={methodPanelId(m.key)}
            tabIndex={selected ? 0 : -1}
            className="pay-method"
            onClick={() => onChange(m.key)}
            disabled={disabled}
          >
            <span className="pay-method-icon" aria-hidden="true">{m.icon}</span>
            <span className="pay-method-text">
              <span className="pay-method-label">{m.label}</span>
              <span className="pay-method-hint">{m.hint}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
