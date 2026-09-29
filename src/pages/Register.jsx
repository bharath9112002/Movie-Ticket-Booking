import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import PasswordInput from '../components/PasswordInput'
import { validateRegister, passwordStrength } from '../utils/validation'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  terms: false,
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const strength = passwordStrength(form.password)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: '' }))
    setFormError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validation = validateRegister(form)
    setErrors(validation)
    if (Object.keys(validation).length) return

    const result = register(form)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    navigate('/login', {
      replace: true,
      state: { message: 'Account created! Please log in.' },
    })
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join CineBook and start booking in seconds."
      footer={
        <>
          Already have an account? <Link to="/login">Login</Link>
        </>
      }
    >
      {formError && <div className="alert alert-error" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          id="name"
          name="name"
          label="Full name"
          placeholder="John Doe"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <TextInput
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextInput
          id="phone"
          name="phone"
          type="tel"
          label="Mobile number"
          placeholder="9876543210"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
        />
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        {form.password && (
          <div className="strength" data-score={strength.score}>
            <div className="strength-bar">
              <span style={{ width: `${(strength.score / 4) * 100}%` }} />
            </div>
            <span className="strength-label">{strength.label}</span>
          </div>
        )}
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            name="terms"
            checked={form.terms}
            onChange={handleChange}
          />
          I agree to the Terms &amp; Privacy Policy
        </label>
        {errors.terms && <p className="error">{errors.terms}</p>}
        <button type="submit" className="btn btn-primary btn-block">
          Register
        </button>
      </form>
    </AuthLayout>
  )
}
