import { useState, useEffect } from 'react'
import { api } from '../config/api'
import type { Category } from '../types'

export function useCategorias() {
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/categories')
      .then(({ data }) => setCategorias((data.data || []).filter((c: Category) => c.is_active)))
      .catch(() => setCategorias([]))
      .finally(() => setLoading(false))
  }, [])

  return { categorias, loading }
}
