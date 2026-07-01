import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { NetWorthEntry, Account, Investment, Debt } from '../types'
import toast from 'react-hot-toast'
import { TrendingUp, ArrowLeft, RefreshCw, Loader2, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/format'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function NetWorthPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState<NetWorthEntry[]>([])
  const [currentNetWorth, setCurrentNetWorth] = useState({ total_assets: 0, total_liabilities: 0, net_worth: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const calculateNetWorth = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [accResult, invResult, debtResult, histResult] = await Promise.all([
        supabase.from('accounts').select('balance').eq('user_id', user.id),
        supabase.from('investments').select('current_value').eq('user_id', user.id),
        supabase.from('debts').select('remaining_amount, type').eq('user_id', user.id).eq('is_settled', false),
        supabase.from('net_worth_history').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(30)
      ])

      const totalAssets = (accResult.data || []).reduce((s: number, a: any) => s + Number(a.balance), 0) +
                          (invResult.data || []).reduce((s: number, i: any) => s + Number(i.current_value), 0)

      const debts = (debtResult.data || []).filter((d: any) => d.type === 'debt').reduce((s: number, d: any) => s + Number(d.remaining_amount), 0)
      const receivables = (debtResult.data || []).filter((d: any) => d.type === 'receivable').reduce((s: number, d: any) => s + Number(d.remaining_amount), 0)

      setCurrentNetWorth({
        total_assets: totalAssets + receivables,
        total_liabilities: debts,
        net_worth: (totalAssets + receivables) - debts
      })

      if (histResult.data) setHistory(histResult.data as NetWorthEntry[])
    } catch (err: any) {
      toast.error('Gagal menghitung: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => { calculateNetWorth() }, [user])

  const recordSnapshot = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('net_worth_history').upsert({
      user_id: user.id,
      total_assets: currentNetWorth.total_assets,
      total_liabilities: currentNetWorth.total_liabilities,
      net_worth: currentNetWorth.net_worth,
      recorded_at: new Date().toISOString().split('T')[0]
    }, { onConflict: 'user_id, recorded_at' })
    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else { toast.success('Snapshot net worth tersimpan'); calculateNetWorth() }
    setSaving(false)
  }

  const chartData = [...history].reverse().map(h => ({
    date: formatDate(h.recorded_at),
    Aset: Number(h.total_assets),
    Liabilitas: Number(h.total_liabilities),
    'Net Worth': Number(h.net_worth)
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl">Net Worth</h1>
            <p className="text-sm">Kekayaan bersih = Aset - Liabilitas</p>
          </div>
        </div>
        <button onClick={recordSnapshot} disabled={saving} className="btn btn-primary">
          {saving ? <><Loader2 size={16} className="pulse" /> Menyimpan...</> : <><RefreshCw size={16} /> Rekam Snapshot</>}
        </button>
      </div>

      {loading ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Menghitung...</p></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Aset</p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(currentNetWorth.total_assets)}</h2>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Liabilitas</p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(currentNetWorth.total_liabilities)}</h2>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: `4px solid ${currentNetWorth.net_worth >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Worth</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: currentNetWorth.net_worth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(currentNetWorth.net_worth)}
              </h2>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Tren Net Worth</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'jt' : v >= 1000 ? (v / 1000).toFixed(0) + 'rb' : String(v)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="Aset" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Liabilitas" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Net Worth" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <BarChart3 size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Riwayat</h3>
              <p style={{ marginBottom: '1rem' }}>Klik "Rekam Snapshot" untuk menyimpan kondisi keuangan hari ini.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
