import { useState, useEffect, useCallback, useRef } from 'react'
import { Category } from '../types'
import { fetchCategories } from '../utils/supabase'
import { fetchWithTimeout } from '../lib/timeout'

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const cancelledRef = useRef(false)

  const load = useCallback(async () => {
    if (!userId) return
    cancelledRef.current = false
    setLoading(true)
    try {
      const data = await fetchWithTimeout(fetchCategories(userId), 10000, 'fetchCategories')
      if (cancelledRef.current) return
      setCategories(data)
    } catch {
      if (!cancelledRef.current) setCategories([])
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    cancelledRef.current = true
    load()
  }, [load])

  return { categories, loading, refresh: load }
}
