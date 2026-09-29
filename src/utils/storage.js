// Static auth: all data lives in the browser's localStorage.
// Passwords are stored as-is because there is no backend — do not reuse this for real accounts.
const USERS_KEY = 'mtb_users'
const CURRENT_USER_KEY = 'mtb_current_user'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@cinebook.com',
  phone: '9876543210',
  password: 'Demo@1234',
  createdAt: '2026-01-01T00:00:00.000Z',
}

// The demo account is always present, even if storage was cleared or it was removed.
export const getUsers = () => {
  const users = read(USERS_KEY, [])
  return users.some((u) => u.email === DEMO_USER.email) ? users : [DEMO_USER, ...users]
}
export const saveUsers = (users) => write(USERS_KEY, users)

export const getCurrentUser = () => read(CURRENT_USER_KEY, null)
export const saveCurrentUser = (user) => write(CURRENT_USER_KEY, user)
export const clearCurrentUser = () => localStorage.removeItem(CURRENT_USER_KEY)
