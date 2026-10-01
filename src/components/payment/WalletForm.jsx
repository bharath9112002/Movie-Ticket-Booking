import { WALLETS } from '../../utils/payment'
import { formatCurrency } from '../../utils/format'

export default function WalletForm({ value, error, onChange, amount, disabled }) {
  return (
    <fieldset className="wallet-form" aria-describedby={error ? 'wallet-error' : undefined}>
      <legend className="pay-legend">Choose a wallet</legend>
      <div className="wallet-list">
        {WALLETS.map((w) => {
          const short = amount - w.balance
          return (
            <label key={w.key} className={`wallet-option${value === w.key ? ' is-selected' : ''}`} style={{ '--brand': w.color }}>
              <input
                type="radio"
                name="wallet"
                value={w.key}
                checked={value === w.key}
                onChange={() => onChange(w.key)}
                disabled={disabled}
              />
              <span className="wallet-logo" aria-hidden="true">{w.label[0]}</span>
              <span className="wallet-text">
                <span className="wallet-name">{w.label}</span>
                <span className={`wallet-balance${short > 0 ? ' is-low' : ''}`}>
                  Balance {formatCurrency(w.balance)}
                  {short > 0 && ` · ${formatCurrency(short)} short`}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p className="error" id="wallet-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}
