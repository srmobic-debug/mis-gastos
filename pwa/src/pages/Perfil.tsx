import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../config/api'

export default function Perfil() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [currPass, setCurrPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')
  const [passError, setPassError] = useState('')

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg('')
    try {
      await api.put('/api/v1/users/profile', { name })
      setProfileMsg('Perfil actualizado correctamente')
    } catch { setProfileMsg('Error al actualizar el perfil') }
    finally { setSavingProfile(false) }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPassError('')
    setPassMsg('')
    if (newPass !== confirmPass) { setPassError('Las contraseñas no coinciden'); return }
    if (newPass.length < 6) { setPassError('La contraseña debe tener al menos 6 caracteres'); return }

    setSavingPass(true)
    try {
      await api.post('/api/v1/users/change-password', {
        currentPassword: currPass,
        newPassword: newPass,
        confirmPassword: confirmPass
      })
      setPassMsg('Contraseña cambiada correctamente')
      setCurrPass('')
      setNewPass('')
      setConfirmPass('')
    } catch { setPassError('Contraseña actual incorrecta') }
    finally { setSavingPass(false) }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>

      {/* Avatar / info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}</p>
          <p className="text-xs text-gray-400">{user?.email || user?.phone || ''}</p>
        </div>
      </div>

      {/* Datos personales */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Datos personales</h2>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {profileMsg && (
            <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{profileMsg}</p>
          )}
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {savingProfile ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Cambiar contraseña</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual</label>
            <input type="password" value={currPass} onChange={e => setCurrPass(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contraseña</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {passError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{passError}</p>}
          {passMsg && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{passMsg}</p>}
          <button
            type="submit"
            disabled={savingPass}
            className="w-full py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {savingPass ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="w-full py-3 border-2 border-red-200 text-red-500 rounded-2xl text-sm font-semibold hover:bg-red-50 transition-colors"
      >
        🚪 Cerrar sesión
      </button>
    </div>
  )
}
