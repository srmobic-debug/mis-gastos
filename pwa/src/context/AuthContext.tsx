import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthState, User } from '../types'

interface AuthContextType {
  auth: AuthState | null
  user: User | null
  isAdmin: boolean
  login: (token: string, user: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restaurar sesión desde localStorage
    const stored = localStorage.getItem('auth')
    if (stored) {
      try {
        const parsed: AuthState = JSON.parse(stored)
        // Verificar que el token no esté expirado (decodificar sin librería)
        const payload = JSON.parse(atob(parsed.token.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          setAuth(parsed)
        } else {
          localStorage.removeItem('auth')
        }
      } catch {
        localStorage.removeItem('auth')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (token: string, user: User) => {
    const newAuth: AuthState = { token, user }
    setAuth(newAuth)
    localStorage.setItem('auth', JSON.stringify(newAuth))
  }

  const logout = () => {
    setAuth(null)
    localStorage.removeItem('auth')
  }

  return (
    <AuthContext.Provider value={{
      auth,
      user: auth?.user ?? null,
      isAdmin: auth?.user.role === 'admin',
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
