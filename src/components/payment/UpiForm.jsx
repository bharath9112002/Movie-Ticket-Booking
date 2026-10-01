import { useEffect, useRef, useState } from 'react'
import FakeQr from './FakeQr'
import TextInput from '../TextInput'
import { QR_TTL_MS, UPI_APPS, newQrExpiry } from '../../utils/payment'
import { formatCurrency } from '../../utils/format'

const remaining = (expiresAt, now) => Math.max(0, Math.ceil((expiresAt - now) / 1000))

export default function UpiForm({ value, errors, onChange, amount, payee, disabled }) {
  const input = useRef(null)
  const [now, setNow] = useState(() => Date.now())
  const qr = value.mode === 'qr'

  useEffect(() => {
    if (!qr) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [qr])

  const setMode = (mode) => {
    const qrExpiresAt = mode === 'qr' ? newQrExpiry() : value.qrExpiresAt
    setNow(qrExpiresAt - QR_TTL_MS) // restart the countdown display at the full time
    onChange({ ...value, mode, qrExpiresAt })
  }

  const pickApp = (app) => {
    const local = value.vpa.split('@')[0]
    onChange({ ...value, vpa: `${local}@${app.handle}`, app: app.key })
    // Put the cursor before the "@" so the user can type their number / name.
    requestAnimationFrame(() => {
      input.current?.focus()
      input.current?.setSelectionRange(local.length, local.length)
    })
  }

  const secondsLeft = qr ? remaining(value.qrExpiresAt, now) : 0
  const expired = qr && secondsLeft === 0

  return (
    <div className="upi-form">
      <div className="segmented" role="radiogroup" aria-label="How do you want to pay with UPI?">
        {[
          ['id', 'Pay with UPI ID'],
          ['qr', 'Scan QR code'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={value.mode === mode}
            className="segmented-option"
            onClick={() => setMode(mode)}
            disabled={disabled}
          >
            {label}
          </button>
        ))}
      </div>

      {qr ? (
        <div className="upi-qr">
          <div className={`upi-qr-code${expired ? ' is-expired' : ''}`}>
            <FakeQr value={`${payee}|${amount}|${value.qrExpiresAt}`} />
            {expired && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode('qr')} disabled={disabled}>
                ↻ Refresh QR
              </button>
            )}
          </div>
          <div className="upi-qr-info">
            <p className="upi-qr-amount">{formatCurrency(amount)}</p>
            <p>Scan with any UPI app to pay {payee}.</p>
            <ol className="upi-qr-steps">
              <li>Open Google Pay, PhonePe, Paytm or any UPI app</li>
              <li>Scan the QR code and approve the payment</li>
              <li>Come back here and tap &ldquo;I&rsquo;ve paid&rdquo;</li>
            </ol>
            <p className={`upi-qr-timer${secondsLeft <= 60 ? ' is-low' : ''}`} aria-live="polite">
              {expired
                ? 'QR code expired. Refresh to get a new one.'
                : `Expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
            </p>
            {errors.qr && <p className="error">{errors.qr}</p>}
          </div>
        </div>
      ) : (
        <div className="pay-fields">
          <div className="upi-apps" role="group" aria-label="Pick your UPI app">
            {UPI_APPS.map((app) => (
              <button
                key={app.key}
                type="button"
                className="upi-app"
                aria-pressed={value.app === app.key}
                style={{ '--brand': app.color }}
                onClick={() => pickApp(app)}
                disabled={disabled}
              >
                <span className="upi-app-logo" aria-hidden="true">{app.label[0]}</span>
                {app.label}
              </button>
            ))}
          </div>
          <TextInput
            ref={input}
            id="upi-id"
            label="UPI ID"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="mobilenumber@upi"
            value={value.vpa}
            onChange={(e) => onChange({ ...value, vpa: e.target.value.trim(), app: '' })}
            error={errors.vpa}
            disabled={disabled}
          />
          <p className="pay-help">We&rsquo;ll send a payment request to this UPI ID. Approve it in your UPI app within 5 minutes.</p>
        </div>
      )}
    </div>
  )
}
