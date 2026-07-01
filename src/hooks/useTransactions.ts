import { useState, useEffect, useCallback, useRef } from 'react'
import { Transaction } from '../types'
import { fetchTransactions } from '../utils/supabase'

const PAGE_SIZE = 20

export function useTransactions(userId: string | undefined, selectedMonth: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const monthRef = useRef(selectedMonth)

  const load = useCallback(async (page = 0, append = false) => {
    if (!userId) return
    if (page === 0) setLoading(true)
    else setLoadingMore(true)
    setError('')

    try {
      const { transactions: data, hasMore: more } = await fetchTransactions(userId, selectedMonth, page, PAGE_SIZE)
      setTransactions(prev => append ? [...prev, ...data] : data)
      setHasMore(more)
    } catch (err: any) {
      setError('Gagal memuat transaksi: ' + err.message)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [userId, selectedMonth])

  useEffect(() => {
    monthRef.current = selectedMonth
    setTransactions([])
    setHasMore(true)
    load(0)
  }, [selectedMonth, load])

  const loadMore = () => {
    const nextPage = Math.floor(transactions.length / PAGE_SIZE)
    load(nextPage, true)
  }

  const refresh = () => load(0)

  return { transactions, loading, loadingMore, hasMore, error, loadMore, refresh, setTransactions }
}
