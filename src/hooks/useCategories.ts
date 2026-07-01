import { useState, useEffect, useCallback } from 'react'
import { Category } from '../types'
import { fetchCategories } from '../utils/supabase'

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await fetchCategories(userId)
      setCategories(data)
    } catch {
      // silent
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { categories, loading, refresh: load }
}
