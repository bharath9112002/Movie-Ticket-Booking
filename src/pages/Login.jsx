import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import PasswordInput from '../components/PasswordInput'
import { validateLogin } from '../utils/validation'
import { DEMO_USER } from '../utils/storage'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const flash = location.state?.message

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: '' }))
    setFormError('')
  }

  const submitLogin = (credentials) => {
    const result = login(credentials)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    const redirectTo = location.state?.from?.pathname || '/'
    navigate(redirectTo, { replace: true })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validation = validateLogin(form)
    setErrors(validation)
    if (Object.keys(validation).length) return
    submitLogin(form)
  }

  const fillDemo = () => {
    setForm((f) => ({ ...f, email: DEMO_USER.email, password: DEMO_USER.password }))
    setErrors({})
    setFormError('')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue booking your tickets."
      footer={
        <>
          New to CineBook? <Link to="/register">Create an account</Link>
        </>
      }
    >
      {flash && !formError && (
        <div className="alert alert-success" role="status">{flash}</div>
      )}
      {formError && <div className="alert alert-error" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
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
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <div className="form-row">
          <label className="checkbox">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="link-sm">
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          Login
        </button>
      </form>

      <button type="button" className="demo-box" onClick={fillDemo}>
        <span className="demo-title">Demo account</span>
        <span className="demo-cred">
          {DEMO_USER.email} / {DEMO_USER.password}
        </span>
      </button>
    </AuthLayout>
  )
}
