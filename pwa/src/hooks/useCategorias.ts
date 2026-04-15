import { useState, useEffect } from 'react'
import { api } from '../config/api'
import type { Category } from '../types'

export function useCategorias() {
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/v1/categories')
      .then(({ data }) => setCategorias(data.categories || []))
      .catch(() => setCategorias([]))
      .finally(() => setLoading(false))
  }, [])

  return { categorias, loading }
}
