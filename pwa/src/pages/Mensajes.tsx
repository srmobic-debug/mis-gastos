import { useState, useEffect, useCallback } from 'react'
import { api } from '../config/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import type { Message } from '../types'

export default function Mensajes() {
  const { isAdmin } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const PER_PAGE = 30

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/messages', {
        params: {
          status: filterStatus || undefined,
          limit: PER_PAGE,
          offset: page * PER_PAGE,
        }
      })
      setMessages(data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterStatus, page])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const TYPE_ICON: Record<string, string> = {
    text: '💬', audio: '🎤', image: '📷', document: '📄'
  }

  const pendingCount = messages.filter(m => m.processing_status === 'pending').length
  const errorCount = messages.filter(m => m.processing_status === 'error').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Mensajes recibidos desde WhatsApp</p>
      </div>

      {/* Resumen de alertas */}
      {(pendingCount > 0 || errorCount > 0) && (
        <div className="flex gap-3 mb-4">
          {pendingCount > 0 && (
            <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              <p className="text-xs text-yellow-600">Pendientes</p>
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{errorCount}</p>
              <p className="text-xs text-red-600">Con error</p>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        {(['', 'pending', 'processed', 'error', 'reviewed'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(0) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'Todos' : s === 'pending' ? 'Pendiente' : s === 'processed' ? 'Procesado' : s === 'error' ? 'Error' : 'Revisado'}
          </button>
        ))}
      </div>

      {/* Lista de mensajes */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p>Sin mensajes con este filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Fila principal */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
              >
                <span className="text-xl mt-0.5">{TYPE_ICON[msg.message_type] || '💬'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAdmin && (
                      <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                        {msg.user_name}
                      </span>
                    )}
                    <StatusBadge status={msg.processing_status} type="message" />
                    <span className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleString('es', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {msg.raw_text || <span className="italic text-gray-400">Sin texto (audio/imagen)</span>}
                  </p>
                  {msg.expense_amount && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      → Gasto: L {Number(msg.expense_amount).toLocaleString()} {msg.expense_category_icon} {msg.expense_category}
                    </p>
                  )}
                  {msg.error_reason && (
                    <p className="text-xs text-red-500 mt-1">⚠ {msg.error_reason}</p>
                  )}
                </div>
                <span className="text-gray-300 text-xs mt-1">{expanded === msg.id ? '▲' : '▼'}</span>
              </div>

              {/* Detalle expandido */}
              {expanded === msg.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Texto completo</p>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {msg.raw_text || '—'}
                      </div>
                    </div>

                    {msg.expense_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Gasto generado:</span>
                        <span className="text-xs font-semibold text-green-700">
                          #{msg.expense_id} · L {Number(msg.expense_amount).toLocaleString()} · <StatusBadge status={msg.expense_status || ''} />
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/gastos/nuevo?message_id=${msg.id}&text=${encodeURIComponent(msg.raw_text || '')}`}
                          className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg font-medium"
                        >
                          + Crear gasto desde este mensaje
                        </button>
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/api/messages/${msg.id}/reprocess`)
                                fetchMessages()
                              } catch { alert('Error al reprocesar') }
                            }}
                            className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg"
                          >
                            🔄 Reprocesar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginación simple */}
      <div className="flex gap-3 justify-center mt-4">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={messages.length < PER_PAGE}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
