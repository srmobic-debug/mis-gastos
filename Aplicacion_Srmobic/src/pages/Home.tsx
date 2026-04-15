import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../config/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import type { DashboardSummary, DashboardCategory, DashboardDaily, Expense } from '../types'

function fmoney(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(n)
}
function mesActual() {
  return new Date().toISOString().slice(0, 7)
}

export default function Home() {
  const { user } = useAuth()
  const [mes] = useState(mesActual())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [categories, setCategories] = useState<DashboardCategory[]>([])
  const [daily, setDaily] = useState<DashboardDaily[]>([])
  const [recent, setRecent] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/dashboard/summary', { params: { mes } }),
      api.get('/api/dashboard/categories', { params: { mes } }),
      api.get('/api/dashboard/daily'),
      api.get('/api/expenses', { params: { limit: 8 } }),
    ]).then(([s, c, d, r]) => {
      setSummary(s.data.data)
      setCategories(c.data.data || [])
      setDaily(d.data.data || [])
      setRecent(r.data.data || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [mes])

  const mesLabel = new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })
  const cambio = summary && summary.total_mes_anterior > 0
    ? ((summary.total_mes - summary.total_mes_anterior) / summary.total_mes_anterior * 100).toFixed(1)
    : null

  const maxDaily = Math.max(...daily.map(d => d.total), 1)

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <p className="text-sm text-gray-500 capitalize">{mesLabel}</p>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.name.split(' ')[0]}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 bg-primary-500 rounded-2xl p-5 text-white">
          <p className="text-primary-200 text-xs font-medium uppercase tracking-wide">Total del mes</p>
          <p className="text-3xl font-bold mt-1">{fmoney(summary?.total_mes || 0)}</p>
          {cambio && (
            <p className={`text-xs mt-1 ${Number(cambio) > 0 ? 'text-red-300' : 'text-green-300'}`}>
              {Number(cambio) > 0 ? '↑' : '↓'} {Math.abs(Number(cambio))}% vs mes anterior
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Movimientos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.cantidad || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Promedio</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmoney(summary?.promedio || 0)}</p>
        </div>
        {(summary?.pendientes || 0) + (summary?.con_error || 0) > 0 && (
          <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                {summary!.pendientes} pendientes · {summary!.con_error} con error
              </p>
              <Link to="/mensajes" className="text-xs text-yellow-600 underline">Ver mensajes →</Link>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de barras diario */}
      {daily.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Últimos 30 días
          </h2>
          <div className="flex items-end gap-1 h-24">
            {daily.map(d => (
              <div
                key={d.date}
                title={`${d.date}: ${fmoney(d.total)}`}
                className="flex-1 bg-primary-100 hover:bg-primary-300 rounded-t transition-colors cursor-default"
                style={{ height: `${Math.round((d.total / maxDaily) * 100)}%`, minHeight: '4px' }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{daily[0]?.date.slice(5)}</span>
            <span>{daily[daily.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Por categoría */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Por categoría
          </h2>
          <div className="space-y-3">
            {categories.slice(0, 5).map(cat => (
              <div key={cat.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 flex items-center gap-1.5">
                    <span>{cat.icon}</span> {cat.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{fmoney(cat.total)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos movimientos */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Últimos movimientos
            </h2>
            <Link to="/movimientos" className="text-xs text-primary-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map(exp => (
              <div key={exp.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: (exp.category_color || '#6366f1') + '22' }}
                >
                  {exp.category_icon || '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {exp.description || exp.category_name || 'Sin descripción'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(exp.expense_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    {exp.category_name && ` · ${exp.category_name}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{fmoney(exp.amount)}</p>
                  <StatusBadge status={exp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && recent.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">💸</p>
          <p className="font-medium text-gray-600">Sin gastos este mes</p>
          <Link to="/gastos/nuevo" className="mt-3 inline-block text-sm text-primary-600 underline">
            Registrar primer gasto
          </Link>
        </div>
      )}
    </div>
  )
}
