import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { fetchTransactionTrend } from '../../utils/supabase'
import { fetchWithTimeout } from '../../lib/timeout'

interface MonthlyTrendChartProps {
  userId: string
}

export default function MonthlyTrendChart({ userId }: MonthlyTrendChartProps) {
  const [data, setData] = useState<{ month: string; income: number; expense: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const fetchTrend = async () => {
      setLoading(true)
      setError('')
      try {
        const months = await fetchWithTimeout(fetchTransactionTrend(userId, 5), 20000, 'MonthlyTrendChart')
        if (!cancelled) setData(months)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Gagal memuat data tren')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTrend()
    return () => { cancelled = true }
  }, [userId])

  return (
    <section className="card">
      <h3 style={{ marginBottom: '1rem' }}>Tren 6 Bulan Terakhir</h3>
      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--danger)', gap: '0.5rem' }}>
          <AlertTriangle size={24} />
          <p style={{ fontSize: '0.9rem' }}>{error}</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--text-muted)', gap: '0.5rem' }}>
          <Loader2 size={24} className="pulse" />
          <p>Memuat data tren...</p>
        </div>
      ) : data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--text-muted)' }}>
          <p>Data tren belum tersedia</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'jt' : v >= 1000 ? (v / 1000).toFixed(0) + 'rb' : v} />
            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
            <Legend />
            <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
