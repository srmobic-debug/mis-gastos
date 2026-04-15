import { useState, useEffect } from 'react'
import { api } from '../config/api'
import type { User } from '../types'

interface UserWithStats extends User {
  expense_count: number
  last_expense_date: string | null
}

export default function Usuarios() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<Partial<UserWithStats> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/users')
      setUsers(data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  async function save() {
    if (!panel?.name) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError('')
    try {
      if (panel.id) {
        await api.put(`/api/users/${panel.id}`, panel)
      } else {
        if (!panel.email && !panel.phone) { setError('Necesita email o teléfono'); setSaving(false); return }
        await api.post('/api/users', panel)
      }
      setPanel(null)
      fetchUsers()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al guardar'
      setError(msg)
    } finally { setSaving(false) }
  }

  async function toggleStatus(user: UserWithStats) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    if (!confirm(`¿${newStatus === 'inactive' ? 'Desactivar' : 'Activar'} a ${user.name}?`)) return
    await api.put(`/api/users/${user.id}`, { status: newStatus })
    fetchUsers()
  }

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )

  const STATUS_COLOR: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
    unregistered: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => setPanel({ role: 'user', status: 'active' })}
          className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando usuarios...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email / Teléfono</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gastos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Último gasto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{u.email || '—'}</div>
                    <div className="text-xs text-gray-400">{u.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[u.status]}`}>
                      {u.status === 'active' ? 'Activo' : u.status === 'inactive' ? 'Inactivo' : 'Sin registrar'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{u.expense_count}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_expense_date
                      ? new Date(u.last_expense_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPanel(u)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                        title={u.status === 'active' ? 'Desactivar' : 'Activar'}
                      >
                        {u.status === 'active' ? '🟢' : '⚪'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear/editar */}
      {panel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {panel.id ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input type="text" value={panel.name || ''} onChange={e => setPanel({ ...panel, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={panel.email || ''} onChange={e => setPanel({ ...panel, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono WhatsApp</label>
                <input type="text" value={panel.phone || ''} onChange={e => setPanel({ ...panel, phone: e.target.value })} placeholder="+50412345678"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select value={panel.role || 'user'} onChange={e => setPanel({ ...panel, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {!panel.id && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña inicial</label>
                  <input type="password" onChange={e => setPanel({ ...panel, password: e.target.value } as typeof panel)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              )}
            </div>
            {error && <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPanel(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
