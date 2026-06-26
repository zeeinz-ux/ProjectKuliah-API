import { createContext, useState, useEffect, useCallback } from 'react'
import { can } from '../utils/permissions'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const syncFromStorage = useCallback(() => {
    const storedToken = localStorage.getItem('token')
    const storedUserRaw = localStorage.getItem('user')

    setToken(storedToken)

    if (storedUserRaw) {
      try {
        setUser(JSON.parse(storedUserRaw))
      } catch {
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const handleStorage = () => syncFromStorage()
    const handleUpdate = () => syncFromStorage()

    window.addEventListener('auth-user-updated', handleUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('auth-user-updated', handleUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [syncFromStorage])

  const hasPermission = useCallback(
    (action, resource) => {
      if (!user) return false
      return can(user.role, action, resource)
    },
    [user],
  )

  const role = user?.role || null

  return (
    <AuthContext.Provider value={{ user, token, role, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}
