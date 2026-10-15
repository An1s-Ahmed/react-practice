import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('authToken')))

  useEffect(() => {
    if (!token) return
    let active = true
    apiRequest('/auth/me')
      .then(({ user: account }) => {
        if (active) setUser(account)
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem('authToken')
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  async function authenticate(path, body) {
    try {
      const result = await apiRequest(`/auth${path}`, { method: 'POST', body: JSON.stringify(body) })
      setToken(result.token)
      setUser(result.user)
      localStorage.setItem('authToken', result.token)
      return { user: result.user }
    } catch (error) {
      return { error: error.message }
    }
  }

  function register({ name, email, password, confirmPassword }) {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) return Promise.resolve({ error: 'Please complete every field.' })
    if (password !== confirmPassword) return Promise.resolve({ error: 'Passwords do not match.' })
    return authenticate('/register', { name, email, password })
  }

  function login(email, password) {
    return authenticate('/login', { email, password })
  }

  function logout() {
    setUser(null)
    setToken(null)
    setLoading(false)
    localStorage.removeItem('authToken')
  }

  async function updateProfile({ name, email }) {
    try {
      const result = await apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name, email }) })
      setUser(result.user)
      return {}
    } catch (error) {
      return { error: error.message }
    }
  }

  return <AuthContext.Provider value={{ user, loading, register, login, logout, updateProfile }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)