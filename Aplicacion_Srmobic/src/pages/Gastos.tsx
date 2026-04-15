import { useState } from 'react'
import { useGastos } from '../hooks/useGastos'
import type { Gasto } from '../types'
import { api } from '../config/api'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(n)
}

function mesActual() {
  return new Date().toISOString().slice(0, 7)
}

export default function Gastos() {
  const [mes, setMes] = useState(mesActual())
  const { gastos, loading, error, refetch } = useGastos({ mes })
  const [eliminando, setEliminando] = useState<number | null>(null)

  async function eliminarGasto(gasto: Gasto) {
    if (!confirm(`¿Eliminar "${gasto.description || 'este gasto'}"?`)) return
    setEliminando(gasto.id)
    try {
      await api.delete(`/gastos/${gasto.id}`)
      refetch()
    } catch {
      alert('Error al eliminar el gasto')
    } finally {
      setEliminando(null)
    }
  }

  const total = gastos.reduce((s, g) => s + g.amount, 0)

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Total del filtro */}
      {!loading && gastos.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-3 mb-4 flex justify-between items-center">
          <span className="text-sm text-primary-700 font-medium">{gastos.length} gastos</span>
          <span className="text-lg font-bold text-primary-700">{formatMoney(total)}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-16" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-10 text-red-500">
          <p>{error}</p>
          <button onClick={refetch} className="mt-3 text-sm text-primary-600 underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Lista */}
      {!loading && !error && (
        <div className="space-y-2">
          {gastos.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: g.category_color + '22' }}
              >
                {g.category_icon || '💰'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {g.description || g.category_name || 'Sin descripción'}
                </p>
                <p className="text-xs text-gray-400 flex gap-2">
                  <span>
                    {new Date(g.expense_date).toLocaleDateString('es', {
                      day: 'numeric', month: 'short'
                    })}
                  </span>
                  {g.category_name && <span>· {g.category_name}</span>}
                  <span>· {g.capture_channel}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-gray-900">{formatMoney(g.amount)}</span>
                <button
                  onClick={() => eliminarGasto(g)}
                  disabled={eliminando === g.id}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {gastos.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-medium">Sin gastos en este período</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
