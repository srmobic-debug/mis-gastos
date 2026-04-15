import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, AlertCircle, DollarSign, Activity, Target, BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardSummary, DashboardCategory, DashboardDaily, Expense } from '../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(n)
}

function mesActual() {
  return new Date().toISOString().slice(0, 7)
}

// Chart colors (Recharts requires actual hex values, not CSS variables)
const CHART_COLORS = {
  grid: '#EAEAEA',
  text: '#7A7A7A',
  line: '#D60000',
  tooltip: '#121212',
  tooltipText: '#FFFFFF',
  icon: '#D60000',
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
      api.get('/api/expenses', { params: { limit: 5 } }),
    ]).then(([s, c, d, r]) => {
      setSummary(s.data.data)
      setCategories(c.data.data || [])
      setDaily(d.data.data || [])
      setRecent(r.data.expenses || r.data.data || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [mes])

  const mesLabel = new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })
  const cambio = summary && summary.total_mes_anterior > 0
    ? ((summary.total_mes - summary.total_mes_anterior) / summary.total_mes_anterior * 100).toFixed(1)
    : null

  // Paleta de colores para pie chart (usar primarios de categorías)
  const categoryColors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
    '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#6366F1'
  ]

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--white-soft)' }}>
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 rounded w-48" style={{ backgroundColor: 'var(--gray-100)' }} />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: 'var(--gray-100)' }} />)}
        </div>
        <div className="h-48 rounded-xl" style={{ backgroundColor: 'var(--gray-100)' }} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--white-soft)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--gray-100)', backgroundColor: 'var(--white)' }}>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-sm capitalize" style={{ color: 'var(--gray-400)' }}>{mesLabel}</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--black-soft)' }}>
            Hola, {user?.name.split(' ')[0]} 👋
          </h1>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* === KPIs === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total del mes */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="kpi-label mb-0">Gasto Total</span>
              <DollarSign size={18} style={{ color: 'var(--red-primary)' }} />
            </div>
            <span className="kpi-value">${(summary?.total_mes || 0).toLocaleString()}</span>
            <span className="kpi-context">del mes</span>
            {cambio && (
              <div className="kpi-change">
                <TrendingUp size={14} style={{ color: Number(cambio) > 0 ? 'var(--red-primary)' : 'var(--gray-400)' }} />
                <span style={{ color: Number(cambio) > 0 ? 'var(--red-primary)' : 'var(--gray-400)' }}>
                  {Number(cambio) > 0 ? '↑' : '↓'} {Math.abs(Number(cambio))}% vs mes anterior
                </span>
              </div>
            )}
          </div>

          {/* Gastos hoy */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="kpi-label mb-0">Hoy</span>
              <Activity size={18} style={{ color: 'var(--red-primary)' }} />
            </div>
            <span className="kpi-value">${(daily[0]?.total || 0).toLocaleString()}</span>
            <span className="kpi-context">
              {new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          {/* Cantidad de gastos */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="kpi-label mb-0">Transacciones</span>
              <Target size={18} style={{ color: 'var(--red-primary)' }} />
            </div>
            <span className="kpi-value">{summary?.cantidad || 0}</span>
            <span className="kpi-context">movimientos registrados</span>
          </div>

          {/* Promedio */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="kpi-label mb-0">Promedio</span>
              <BarChart3 size={18} style={{ color: 'var(--red-primary)' }} />
            </div>
            <span className="kpi-value">${(summary?.promedio || 0).toLocaleString()}</span>
            <span className="kpi-context">por transacción</span>
          </div>
        </div>

        {/* === Gráficos principales === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Categorías */}
          {categories.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--gray-700)' }}>
                Gasto por Categoría
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="total"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ value }) => {
                      const total = categories.reduce((sum, cat) => sum + cat.total, 0)
                      const percent = ((value / total) * 100).toFixed(0)
                      return `${percent}%`
                    }}
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => formatMoney(typeof value === 'number' ? value : 0)}
                    contentStyle={{ backgroundColor: CHART_COLORS.tooltip, border: 'none', borderRadius: '8px', color: CHART_COLORS.tooltipText }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                {categories.map((cat, idx) => (
                  <div key={cat.categoria} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} />
                      <span style={{ color: 'var(--gray-700)' }}>{cat.categoria}</span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--black)' }}>
                      {cat.porcentaje}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Chart - Tendencia diaria */}
          {daily.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--gray-700)' }}>
                Tendencia del Mes
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                    tickFormatter={(date) => {
                      const d = new Date(date)
                      return d.getDate().toString()
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                    tickFormatter={(value: unknown) => `$${typeof value === 'number' ? (value / 1000).toFixed(0) : 0}k`}
                  />
                  <Tooltip
                    formatter={(value: unknown) => formatMoney(typeof value === 'number' ? value : 0)}
                    contentStyle={{ backgroundColor: CHART_COLORS.tooltip, border: 'none', borderRadius: '8px', color: CHART_COLORS.tooltipText }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={CHART_COLORS.line}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* === Alertas === */}
        {((summary?.pendientes || 0) + (summary?.con_error || 0) > 0) && (
          <div className="alert alert-warning">
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {summary!.pendientes} pendientes · {summary!.con_error} con error
              </p>
              <p className="text-xs mt-0.5">
                Revisa estos mensajes para asegurar datos correctos
              </p>
            </div>
            <Link to="/mensajes" className="text-xs font-semibold" style={{ color: 'inherit' }}>
              Ver →
            </Link>
          </div>
        )}

        {/* === Últimos movimientos === */}
        {recent.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--gray-700)' }}>
                Últimos Movimientos
              </h2>
              <Link to="/movimientos" className="text-xs font-semibold" style={{ color: 'var(--red-primary)' }}>
                Ver todos →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Fecha</th>
                    <th className="text-left">Descripción</th>
                    <th className="text-left">Categoría</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ color: 'var(--gray-400)' }}>
                        {new Date(exp.expense_date).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td style={{ color: 'var(--gray-700)' }} className="truncate">
                        {exp.description || '—'}
                      </td>
                      <td>
                        {exp.category_name ? (
                          <span style={{ color: 'var(--gray-700)' }}>
                            {exp.category_icon} {exp.category_name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--red-primary)', textAlign: 'right', fontWeight: '600' }}>
                        ${(exp.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && recent.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">💸</p>
            <p className="font-semibold text-lg" style={{ color: 'var(--gray-700)' }}>Sin gastos este mes</p>
            <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Comienza a registrar tus gastos</p>
            <Link to="/gastos/nuevo" className="mt-4 inline-block btn-primary">
              Registrar gasto
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
