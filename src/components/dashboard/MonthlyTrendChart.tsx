import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { AlertTriangle } from 'lucide-react'

interface MonthlyTrendChartProps {
  userId: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function MonthlyTrendChart({ userId }: MonthlyTrendChartProps) {
  const [data, setData] = useState<{ month: string; income: number; expense: number }[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const fetchTrend = async () => {
      setError('')
      const months: { month: string; income: number; expense: number }[] = []
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const startDate = d.toISOString().slice(0, 10)
        const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10)

        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*, categories(type)')
          .eq('user_id', userId)
          .gte('transaction_date', startDate)
          .lt('transaction_date', endDate)

        if (txError) {
          if (!cancelled) setError('Gagal memuat data tren')
          return
        }

        let income = 0, expense = 0
        txData?.forEach(t => {
          if ((t.categories as any)?.type === 'income') income += Number(t.amount)
          else expense += Number(t.amount)
        })

        months.push({
          month: MONTH_NAMES[d.getMonth()],
          income,
          expense
        })
      }

      if (!cancelled) setData(months)
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
