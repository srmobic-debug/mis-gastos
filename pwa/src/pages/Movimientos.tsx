import { useState, useEffect, useCallback } from 'react'
import { api } from '../config/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import type { Expense, Category } from '../types'

function fmoney(n: number) {
  return `$${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: '💬 WhatsApp',
  manual: '✍️ Manual',
  appsmith: '🖥 Admin',
}

export default function Movimientos() {
  const { isAdmin } = useAuth()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 25

  // Modal edición
  const [editing, setEditing] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/v1/categories').then(r => setCategories(r.data.categories || []))
  }, [])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fecha_desde', fechaDesde)
      if (fechaHasta) params.append('fecha_hasta', fechaHasta)
      if (categoryId) params.append('category_id', categoryId)
      if (status) params.append('status', status)
      if (search) params.append('search', search)
      params.append('limit', String(PER_PAGE))
      params.append('offset', String(page * PER_PAGE))

      const { data } = await api.get(`/api/v1/expenses?${params}`)
      setExpenses(data.expenses || [])
      setTotal(data.expenses?.length || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta, categoryId, status, search, page])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    try {
      await api.put(`/api/v1/expenses/${editing.id}`, {
        amount: editing.amount,
        category_id: editing.category_id,
        description: editing.description,
        date: editing.expense_date,
      })
      setEditing(null)
      fetchExpenses()
    } catch { alert('Error al guardar cambios') }
    finally { setSaving(false) }
  }

  async function deleteExpense(id: string | number) {
    if (!confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/api/v1/expenses/${id}`)
      fetchExpenses()
    } catch { alert('Error al eliminar') }
  }

  const totalFiltrado = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--white-soft)' }}>
      {/* Header */}
      <div className="border-b p-6 mb-6" style={{ borderColor: 'var(--gray-100)', backgroundColor: 'var(--white)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--black-soft)' }}>Movimientos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>{total} registros encontrados</p>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-4">
        {/* Filtros */}
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <input
              type="date"
              value={fechaDesde}
              onChange={e => { setFechaDesde(e.target.value); setPage(0) }}
              placeholder="Desde"
              className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
              style={{
                border: '1px solid var(--gray-100)',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-700)',
              }}
            />
            <input
              type="date"
              value={fechaHasta}
              onChange={e => { setFechaHasta(e.target.value); setPage(0) }}
              placeholder="Hasta"
              className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
              style={{
                border: '1px solid var(--gray-100)',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-700)',
              }}
            />
            <select
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); setPage(0) }}
              className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
              style={{
                border: '1px solid var(--gray-100)',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-700)',
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(0) }}
              className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
              style={{
                border: '1px solid var(--gray-100)',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-700)',
              }}
            >
              <option value="">Todos los estados</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
              <option value="incomplete">Incompleto</option>
              <option value="error">Error</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Buscar descripción..."
              className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
              style={{
                border: '1px solid var(--gray-100)',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-700)',
              }}
            />
          </div>

          {/* Total filtrado */}
          {!loading && expenses.length > 0 && (
            <div className="mt-3 pt-3 flex justify-between items-center text-sm" style={{ borderTop: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-400)' }}>{expenses.length} mostrados de {total}</span>
              <span className="font-bold" style={{ color: 'var(--black-soft)' }}>Total: {fmoney(totalFiltrado)}</span>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--gray-400)' }}>Cargando...</div>
          ) : expenses.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p style={{ color: 'var(--gray-400)' }}>Sin resultados con estos filtros</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th className="text-left">Fecha</th>
                      <th className="text-left">Descripción</th>
                      <th className="text-left">Categoría</th>
                      {isAdmin && <th className="text-left">Usuario</th>}
                      <th className="text-right">Monto</th>
                      <th className="text-center">Estado</th>
                      <th className="text-center">Canal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ color: 'var(--gray-400)' }}>
                          {new Date(exp.expense_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td style={{ color: 'var(--gray-700)' }} className="max-w-xs truncate">
                          {exp.description || <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Sin descripción</span>}
                        </td>
                        <td>
                          {exp.category_name
                            ? <span className="flex items-center gap-1" style={{ color: 'var(--gray-700)' }}><span>{exp.category_icon}</span>{exp.category_name}</span>
                            : <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Sin categoría</span>
                          }
                        </td>
                        {isAdmin && <td style={{ color: 'var(--gray-700)' }}>{exp.user_name}</td>}
                        <td style={{ color: 'var(--red-primary)', textAlign: 'right', fontWeight: '600' }}>
                          ${(exp.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <StatusBadge status={exp.status} />
                        </td>
                        <td style={{ color: 'var(--gray-400)', textAlign: 'center', fontSize: '12px' }}>
                          {CHANNEL_LABEL[exp.capture_channel] || exp.capture_channel}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditing(exp)}
                              className="p-1.5 rounded transition"
                              style={{ color: 'var(--gray-400)', backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-primary)'; e.currentTarget.style.backgroundColor = 'var(--error-light)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gray-400)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => deleteExpense(exp.id)}
                                className="p-1.5 rounded transition"
                                style={{ color: 'var(--gray-400)', backgroundColor: 'transparent' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-primary)'; e.currentTarget.style.backgroundColor = 'var(--error-light)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gray-400)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                                title="Eliminar"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-40 btn-secondary"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm" style={{ color: 'var(--gray-400)' }}>Página {page + 1} de {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-40 btn-secondary"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal edición */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-xl w-full max-w-md p-6" style={{ backgroundColor: 'var(--white)', boxShadow: 'var(--shadow-xl)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--black-soft)' }}>Editar gasto #{editing.id}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--gray-400)' }}>Monto</label>
                <input
                  type="number"
                  value={editing.amount}
                  onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                  style={{ border: '1px solid var(--gray-100)', color: 'var(--gray-700)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--gray-400)' }}>Categoría</label>
                <select
                  value={editing.category_id || ''}
                  onChange={e => setEditing({ ...editing, category_id: Number(e.target.value) || null })}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                  style={{ border: '1px solid var(--gray-100)', color: 'var(--gray-700)' }}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--gray-400)' }}>Descripción</label>
                <input
                  type="text"
                  value={editing.description || ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                  style={{ border: '1px solid var(--gray-100)', color: 'var(--gray-700)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--gray-400)' }}>Fecha</label>
                <input
                  type="date"
                  value={editing.expense_date}
                  onChange={e => setEditing({ ...editing, expense_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                  style={{ border: '1px solid var(--gray-100)', color: 'var(--gray-700)' }}
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--gray-400)' }}>Estado</label>
                  <select
                    value={editing.status}
                    onChange={e => setEditing({ ...editing, status: e.target.value as Expense['status'] })}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                    style={{ border: '1px solid var(--gray-100)', color: 'var(--gray-700)' }}
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="pending">Pendiente</option>
                    <option value="incomplete">Incompleto</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60 btn-primary"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
