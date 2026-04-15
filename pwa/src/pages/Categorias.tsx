import { useState, useEffect } from 'react'
import { api } from '../config/api'
import type { Category } from '../types'

const EMOJI_SUGGESTIONS = ['🍔','🚗','💡','💊','🎬','👕','🏠','📚','📦','✈️','🏋️','🐾','🎁','💈','🛒']

export default function Categorias() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/categories')
      setCategories(data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  async function save() {
    if (!panel?.name) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError('')
    try {
      if (panel.id) {
        await api.put(`/api/categories/${panel.id}`, panel)
      } else {
        await api.post('/api/categories', panel)
      }
      setPanel(null)
      fetch()
    } catch { setError('Error al guardar categoría') }
    finally { setSaving(false) }
  }

  async function toggle(id: number) {
    await api.patch(`/api/categories/${id}/toggle`)
    fetch()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administra el catálogo de categorías</p>
        </div>
        <button
          onClick={() => setPanel({ icon: '📦', color: '#6366f1', is_active: true })}
          className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold"
        >
          + Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl border p-4 ${cat.is_active ? 'border-gray-100' : 'border-gray-200 opacity-50'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: cat.color + '22' }}
                >
                  {cat.icon}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPanel(cat)}
                    className="p-1 text-gray-400 hover:text-primary-600 rounded text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => toggle(cat.id)}
                    className="p-1 text-gray-400 hover:text-yellow-600 rounded text-sm"
                    title={cat.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {cat.is_active ? '🟢' : '⚪'}
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cat.expense_count || 0} gastos</p>
            </div>
          ))}
        </div>
      )}

      {/* Panel lateral de creación/edición */}
      {panel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {panel.id ? 'Editar categoría' : 'Nueva categoría'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={panel.name || ''}
                  onChange={e => setPanel({ ...panel, name: e.target.value })}
                  placeholder="Ej: Alimentación"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Ícono</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {EMOJI_SUGGESTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setPanel({ ...panel, icon: emoji })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-all ${
                        panel.icon === emoji ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={panel.icon || ''}
                  onChange={e => setPanel({ ...panel, icon: e.target.value })}
                  placeholder="O escribe un emoji..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={panel.color || '#6366f1'}
                    onChange={e => setPanel({ ...panel, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={panel.color || '#6366f1'}
                    onChange={e => setPanel({ ...panel, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setPanel(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">
                Cancelar
              </button>
              <button
                onClick={save}
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
