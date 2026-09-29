const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[6-9]\d{9}$/

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address'
  return ''
}

export function validatePassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Include at least one lowercase letter'
  if (!/\d/.test(password)) return 'Include at least one number'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Include at least one special character'
  return ''
}

export function validateLogin({ email, password }) {
  const errors = {}
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  if (!password) errors.password = 'Password is required'
  return errors
}

export function validateRegister({ name, email, phone, password, confirmPassword, terms }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Full name is required'
  else if (name.trim().length < 3) errors.name = 'Name must be at least 3 characters'
  else if (!/^[A-Za-z\s.]+$/.test(name.trim())) errors.name = 'Name can only contain letters and spaces'

  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError

  if (!phone.trim()) errors.phone = 'Phone number is required'
  else if (!PHONE_RE.test(phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number'

  const passwordError = validatePassword(password)
  if (passwordError) errors.password = passwordError

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password'
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match'

  if (!terms) errors.terms = 'You must accept the terms to continue'
  return errors
}

export function passwordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}
