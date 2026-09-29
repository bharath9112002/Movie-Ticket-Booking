import { createContext, useContext, useState } from 'react'
import {
  getUsers,
  saveUsers,
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
} from '../utils/storage'

const AuthContext = createContext(null)

// Never keep the password in the session object.
const toSessionUser = ({ password: _password, ...user }) => user

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    saveUsers(getUsers()) // persist the demo account on first load
    return getCurrentUser()
  })

  const register = ({ name, email, phone, password }) => {
    const users = getUsers()
    const normalizedEmail = email.trim().toLowerCase()
    if (users.some((u) => u.email === normalizedEmail)) {
      return { ok: false, error: 'An account with this email already exists' }
    }
    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      createdAt: new Date().toISOString(),
    }
    saveUsers([...users, newUser])
    return { ok: true }
  }

  const login = ({ email, password, remember }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const found = getUsers().find((u) => u.email === normalizedEmail)
    if (!found || found.password !== password) {
      return { ok: false, error: 'Invalid email or password' }
    }
    const sessionUser = {
      ...toSessionUser(found),
      remember: Boolean(remember),
      loggedInAt: new Date().toISOString(),
    }
    saveCurrentUser(sessionUser)
    setUser(sessionUser)
    return { ok: true }
  }

  const logout = () => {
    clearCurrentUser()
    setUser(null)
  }

  const emailExists = (email) =>
    getUsers().some((u) => u.email === email.trim().toLowerCase())

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), register, login, logout, emailExists }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
