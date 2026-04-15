import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Inyectar JWT en cada request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth')
  if (stored) {
    try {
      const { token } = JSON.parse(stored)
      config.headers.Authorization = `Bearer ${token}`
    } catch { /* sin token */ }
  }
  return config
})

// Manejo global: 401 → redirigir a login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
