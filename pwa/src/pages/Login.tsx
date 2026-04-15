import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../config/api'
import axios from 'axios'
import logoImg from '../assets/logo.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/api/v1/auth/login', {
        email: email.trim(),
        password,
      })

      if (data.user && data.token) {
        login(data.token, data.user)
        navigate('/')
      } else {
        setError('Credenciales inválidas')
      }
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Error al conectar con el servidor'
      setError(msg)
      console.error('Error de login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--white-soft)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4" style={{ backgroundColor: 'var(--white)' }}>
            <img src={logoImg} alt="sr.mobic" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--black-soft)' }}>sr.mobic</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Controla tus gastos fácilmente</p>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--white)' }}>
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--black-soft)' }}>Acceso</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase" style={{ color: 'var(--gray-400)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition text-sm"
                style={{
                  border: '1px solid var(--gray-100)',
                  color: 'var(--gray-700)',
                  backgroundColor: 'var(--white-soft)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase" style={{ color: 'var(--gray-400)' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 transition text-sm"
                  style={{
                    border: '1px solid var(--gray-100)',
                    color: 'var(--gray-700)',
                    backgroundColor: 'var(--white-soft)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg transition"
                  style={{ color: 'var(--gray-400)' }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error-border)', color: '#991B1B' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-primary"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--red-dark)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--red-primary)'}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: 'var(--gray-400)' }}>
            Sin acceso? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  )
}
