import { useState, useEffect, useCallback } from 'react'
import { api } from '../config/api'
import type { Gasto } from '../types'

interface UseGastosParams {
  mes?: string
  categoria_id?: number
}

export function useGastos(params: UseGastosParams = {}) {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGastos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/api/v1/expenses', { params })
      setGastos(data.expenses || [])
    } catch {
      setError('No se pudo cargar los gastos')
    } finally {
      setLoading(false)
    }
  }, [params.mes, params.categoria_id])

  useEffect(() => { fetchGastos() }, [fetchGastos])

  return { gastos, loading, error, refetch: fetchGastos }
}
