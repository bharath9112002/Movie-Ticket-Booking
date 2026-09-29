import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import { validateEmail } from '../utils/validation'

// UI only: no email is actually sent since the app has no backend.
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    setError(emailError)
    if (!emailError) setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Check your inbox"
        footer={<Link to="/login">← Back to login</Link>}
      >
        <div className="alert alert-success" role="status">
          If an account exists for <strong>{email.trim()}</strong>, you&apos;ll
          receive a password reset link shortly.
        </div>
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={() => setSubmitted(false)}
        >
          Use a different email
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your registered email and we'll send you a reset link."
      footer={<Link to="/login">← Back to login</Link>}
    >
      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          error={error}
        />
        <button type="submit" className="btn btn-primary btn-block">
          Send reset link
        </button>
      </form>
    </AuthLayout>
  )
}
