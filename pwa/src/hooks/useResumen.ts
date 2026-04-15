import { useState, useEffect } from 'react'
import { api } from '../config/api'
import type { DashboardSummary } from '../types'

export function useResumen(mes?: string) {
  const [resumen, setResumen] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResumen = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/api/v1/expenses/summary/total')
        setResumen(data.summary)
      } catch {
        setError('No se pudo cargar el resumen')
      } finally {
        setLoading(false)
      }
    }
    fetchResumen()
  }, [mes])

  return { resumen, loading, error }
}
