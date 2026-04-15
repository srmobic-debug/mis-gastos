import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCategorias } from '../hooks/useCategorias'
import { useAuth } from '../context/AuthContext'
import { api } from '../config/api'

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Efectivo' },
  { value: 'card', label: '💳 Tarjeta' },
  { value: 'transfer', label: '🏦 Transferencia' },
  { value: 'other', label: '📦 Otro' },
]

export default function Agregar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { categorias } = useCategorias()

  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState(searchParams.get('text') || '')
  const [categoriaId, setCategoriaId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const messageId = searchParams.get('message_id')

  useEffect(() => {
    // Si viene de un mensaje, mostrar aviso
    if (messageId) {
      setDescripcion(searchParams.get('text') || '')
    }
  }, [messageId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    const montoNum = parseFloat(monto)
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('El monto debe ser un número positivo')
      return
    }
    if (!categoriaId) {
      setErrorMsg('Debes seleccionar una categoría')
      return
    }
    setEnviando(true)
    try {
      await api.post('/api/v1/expenses', {
        amount: montoNum,
        category_id: parseInt(categoriaId),
        description: descripcion.trim(),
        date: fecha,
      })
      setExito(true)
      setTimeout(() => navigate('/movimientos'), 1400)
    } catch { setErrorMsg('No se pudo guardar el gasto. Intenta de nuevo.') }
    finally { setEnviando(false) }
  }

  if (exito) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl mb-4">✅</div>
      <p className="text-xl font-bold text-gray-800">¡Gasto guardado!</p>
      <p className="text-gray-500 text-sm mt-1">Redirigiendo...</p>
    </div>
  )

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Gasto</h1>
        {messageId && (
          <p className="text-sm text-primary-600 mt-1 bg-primary-50 rounded-lg px-3 py-2 inline-block">
            💬 Creando desde mensaje #{messageId}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {categorias.filter(cat => !cat.name?.toUpperCase().includes('CIRCLE') && !cat.name?.toUpperCase().includes('OTROS')).map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaId(String(cat.id))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium h-24 justify-center ${
                  categoriaId === String(cat.id)
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="line-clamp-2 w-full text-center text-xs">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Ej: Almuerzo en el trabajo"
            rows={2}
            maxLength={300}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Fecha y método de pago en dos columnas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sin especificar</option>
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{errorMsg}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="flex-1 py-3.5 rounded-xl bg-primary-500 text-white font-semibold disabled:opacity-60"
          >
            {enviando ? 'Guardando...' : 'Guardar gasto'}
          </button>
        </div>
      </form>
    </div>
  )
}
