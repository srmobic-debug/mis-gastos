import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthState, User } from '../types'

interface AuthContextType {
  auth: AuthState | null
  user: User | null
  isAdmin: boolean
  login: (user: User, token?: string) => void
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
        // Si hay token, verificar que no esté expirado (decodificar sin librería)
        if (parsed.token) {
          try {
            const payload = JSON.parse(atob(parsed.token.split('.')[1]))
            if (payload.exp * 1000 > Date.now()) {
              setAuth(parsed)
            } else {
              localStorage.removeItem('auth')
              localStorage.removeItem('user')
            }
          } catch {
            localStorage.removeItem('auth')
            localStorage.removeItem('user')
          }
        } else {
          // Si no hay token, aún es válida la sesión (sistema sin tokens)
          setAuth(parsed)
        }
      } catch {
        localStorage.removeItem('auth')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (user: User, token?: string) => {
    const newAuth: AuthState = { user, ...(token && { token }) }
    setAuth(newAuth)
    // Guardar user en localStorage también (para acceso directo sin decodificar auth)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('auth', JSON.stringify(newAuth))
    console.log('✅ Login exitoso:', { user: user.email, hasToken: !!token })
  }

  const logout = () => {
    setAuth(null)
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    console.log('👋 Logout exitoso')
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
