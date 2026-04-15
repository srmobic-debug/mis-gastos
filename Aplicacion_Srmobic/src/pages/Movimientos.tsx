import { useState, useEffect, useCallback } from 'react'
import { api } from '../config/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import type { Expense, Category } from '../types'

function fmoney(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(n)
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
    api.get('/api/categories').then(r => setCategories(r.data.data || []))
  }, [])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/expenses', {
        params: {
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
          category_id: categoryId || undefined,
          status: status || undefined,
          search: search || undefined,
          limit: PER_PAGE,
          offset: page * PER_PAGE,
        }
      })
      setExpenses(data.data || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta, categoryId, status, search, page])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    try {
      await api.put(`/api/expenses/${editing.id}`, {
        amount: editing.amount,
        category_id: editing.category_id,
        description: editing.description,
        expense_date: editing.expense_date,
        payment_method: editing.payment_method,
        status: editing.status,
      })
      setEditing(null)
      fetchExpenses()
    } catch { alert('Error al guardar cambios') }
    finally { setSaving(false) }
  }

  async function deleteExpense(id: number) {
    if (!confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/api/expenses/${id}`)
      fetchExpenses()
    } catch { alert('Error al eliminar') }
  }

  const totalFiltrado = expenses.reduce((s, e) => s + e.amount, 0)
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registros encontrados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <input
            type="date"
            value={fechaDesde}
            onChange={e => { setFechaDesde(e.target.value); setPage(0) }}
            placeholder="Desde"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="date"
            value={fechaHasta}
            onChange={e => { setFechaHasta(e.target.value); setPage(0) }}
            placeholder="Hasta"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={categoryId}
            onChange={e => { setCategoryId(e.target.value); setPage(0) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Total filtrado */}
        {!loading && expenses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-gray-500">{expenses.length} mostrados de {total}</span>
            <span className="font-bold text-gray-900">Total: {fmoney(totalFiltrado)}</span>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : expenses.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>Sin resultados con estos filtros</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                    {isAdmin && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>}
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monto</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Canal</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(exp.expense_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-gray-800 max-w-xs truncate">
                        {exp.description || <span className="text-gray-400 italic">Sin descripción</span>}
                      </td>
                      <td className="px-4 py-3">
                        {exp.category_name
                          ? <span className="flex items-center gap-1"><span>{exp.category_icon}</span>{exp.category_name}</span>
                          : <span className="text-gray-400 italic">Sin categoría</span>
                        }
                      </td>
                      {isAdmin && <td className="px-4 py-3 text-gray-600">{exp.user_name}</td>}
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {fmoney(exp.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={exp.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {CHANNEL_LABEL[exp.capture_channel] || exp.capture_channel}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditing(exp)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => deleteExpense(exp.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-500">Página {page + 1} de {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal edición */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar gasto #{editing.id}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
                <input
                  type="number"
                  value={editing.amount}
                  onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                <select
                  value={editing.category_id || ''}
                  onChange={e => setEditing({ ...editing, category_id: Number(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editing.description || ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={editing.expense_date}
                  onChange={e => setEditing({ ...editing, expense_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select
                    value={editing.status}
                    onChange={e => setEditing({ ...editing, status: e.target.value as Expense['status'] })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
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
