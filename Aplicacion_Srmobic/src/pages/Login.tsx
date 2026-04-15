import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const N8N_BASE = import.meta.env.VITE_N8N_URL || 'https://n8n.srmobic.com/webhook'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginVal, setLoginVal] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${N8N_BASE}/auth/login`, {
        login: loginVal.trim(),
        password,
      })

      console.log('RESPONSE:', data)

      // 🔥 CORRECCIÓN CLAVE
      if (data.user) {
        console.log('✅ Login correcto')

        login(data.user, data.token) // token opcional

        navigate('/')
      } else {
        console.log('❌ Login inválido')
        setError('Credenciales inválidas')
      }
    } catch (err: any) {
      console.error('❌ Error en login:', err)

      const msg =
        err?.response?.data?.error ||
        'Error al conectar con el servidor'

      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg text-3xl mb-4">
            💸
          </div>
          <h1 className="text-2xl font-bold text-white">Mis Gastos</h1>
          <p className="text-primary-200 text-sm mt-1">
            Control financiero personal
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email o teléfono
              </label>
              <input
                type="text"
                value={loginVal}
                onChange={(e) => setLoginVal(e.target.value)}
                placeholder="correo@ejemplo.com o +50412345678"
                autoComplete="username"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Si no tienes acceso, contacta al administrador
          </p>
        </div>
      </div>
    </div>
  )
}