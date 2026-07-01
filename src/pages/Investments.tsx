import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Investment } from '../types'
import toast from 'react-hot-toast'
import { TrendingUp, Plus, Pencil, Trash2, X, Check, Loader2, ArrowLeft, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/format'

const INVEST_TYPES = [
  { value: 'stock', label: 'Saham' },
  { value: 'mutual_fund', label: 'Reksadana' },
  { value: 'crypto', label: 'Kripto' },
  { value: 'gold', label: 'Emas' },
  { value: 'property', label: 'Properti' },
  { value: 'deposit', label: 'Deposito' },
  { value: 'other', label: 'Lainnya' }
]

export default function InvestmentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Investment | null>(null)
  const [form, setForm] = useState({ name: '', type: 'stock' as Investment['type'], amount_invested: '', current_value: '', purchase_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) toast.error('Gagal memuat investasi')
    else setItems(data as Investment[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user])

  const openEdit = (inv: Investment) => {
    setEditing(inv)
    setForm({ name: inv.name, type: inv.type, amount_invested: inv.amount_invested.toString(), current_value: inv.current_value.toString(), purchase_date: inv.purchase_date || '', notes: inv.notes || '' })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.name) return
    setSaving(true)
    const payload = { user_id: user.id, name: form.name.trim(), type: form.type, amount_invested: Number(form.amount_invested) || 0, current_value: Number(form.current_value) || 0, purchase_date: form.purchase_date || null, notes: form.notes || null }
    const { error } = editing
      ? await supabase.from('investments').update(payload).eq('id', editing.id)
      : await supabase.from('investments').insert(payload)
    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else { toast.success(editing ? 'Investasi diperbarui' : 'Investasi ditambahkan'); setShowForm(false); loadData() }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus investasi "${name}"?`)) return
    const { error } = await supabase.from('investments').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else { toast.success('Investasi dihapus'); loadData() }
  }

  const totalInvested = items.reduce((s, i) => s + i.amount_invested, 0)
  const totalCurrent = items.reduce((s, i) => s + i.current_value, 0)
  const totalReturn = totalCurrent - totalInvested
  const returnPercent = totalInvested > 0 ? ((totalReturn / totalInvested) * 100) : 0

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl">Investasi</h1>
            <p className="text-sm">Portofolio saham, reksadana, kripto, emas, dan lainnya</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', type: 'stock', amount_invested: '', current_value: '', purchase_date: '', notes: '' }); setShowForm(true) }} className="btn btn-primary">
          <Plus size={18} /> Tambah Investasi
        </button>
      </div>

      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Modal</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatCurrency(totalInvested)}</h2>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nilai Saat Ini</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatCurrency(totalCurrent)}</h2>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Return</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: totalReturn >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)} ({totalReturn >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%)
            </h2>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Memuat...</p></div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <TrendingUp size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Investasi</h3>
          <p style={{ marginBottom: '1rem' }}>Lacak portofolio investasi Anda di sini.</p>
          <button onClick={() => { setEditing(null); setForm({ name: '', type: 'stock', amount_invested: '', current_value: '', purchase_date: '', notes: '' }); setShowForm(true) }} className="btn btn-primary">
            <Plus size={16} /> Tambah Investasi
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {items.map(inv => {
            const profit = inv.current_value - inv.amount_invested
            const profitPct = inv.amount_invested > 0 ? ((profit / inv.amount_invested) * 100) : 0
            return (
              <div key={inv.id} className="card" style={{ borderLeft: `4px solid ${profit >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>
                      {INVEST_TYPES.find(t => t.value === inv.type)?.label}
                    </span>
                    <h3 style={{ fontSize: '1rem', marginTop: '0.1rem' }}>{inv.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEdit(inv)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(inv.id, inv.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Modal: {formatCurrency(inv.amount_invested)}</span>
                  <span style={{ fontWeight: 700 }}>Rp {formatCurrency(inv.current_value)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                  {profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                </div>
                {inv.purchase_date && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Dibeli: {formatDate(inv.purchase_date)}</p>}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{editing ? 'Edit Investasi' : 'Tambah Investasi'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nama / Instrumen</label>
                <input type="text" className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: BBCA" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  {INVEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Modal ({formatCurrency(Number(form.amount_invested) || 0)})</label>
                <input type="number" className="form-input" required value={form.amount_invested} onChange={(e) => setForm({ ...form, amount_invested: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Nilai Saat Ini ({formatCurrency(Number(form.current_value) || 0)})</label>
                <input type="number" className="form-input" required value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Beli (opsional)</label>
                <input type="date" className="form-input" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <input type="text" className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <><Loader2 size={16} className="pulse" /> Menyimpan...</> : <><Check size={16} /> {editing ? 'Simpan' : 'Tambah'}</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary"><X size={16} /> Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
