import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Debt } from '../types'
import toast from 'react-hot-toast'
import { CircleDollarSign, Plus, Pencil, Trash2, X, Check, Loader2, ArrowLeft, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/format'

export default function DebtsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [form, setForm] = useState({ name: '', type: 'debt' as Debt['type'], total_amount: '', remaining_amount: '', interest_rate: '', due_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [payForm, setPayForm] = useState<{ id: string; amount: string } | null>(null)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('debts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) toast.error('Gagal memuat utang/piutang')
    else setItems(data as Debt[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user])

  const openEdit = (d: Debt) => {
    setEditing(d)
    setForm({ name: d.name, type: d.type, total_amount: d.total_amount.toString(), remaining_amount: d.remaining_amount.toString(), interest_rate: d.interest_rate.toString(), due_date: d.due_date || '', notes: d.notes || '' })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.name || !form.total_amount) return
    setSaving(true)
    const payload = { user_id: user.id, name: form.name.trim(), type: form.type, total_amount: Number(form.total_amount), remaining_amount: Number(form.remaining_amount) ?? Number(form.total_amount), interest_rate: Number(form.interest_rate) || 0, due_date: form.due_date || null, notes: form.notes || null, is_settled: Number(form.remaining_amount) <= 0 }
    const { error } = editing
      ? await supabase.from('debts').update(payload).eq('id', editing.id)
      : await supabase.from('debts').insert(payload)
    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else { toast.success(editing ? 'Diperbarui' : 'Ditambahkan'); setShowForm(false); loadData() }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}"?`)) return
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else { toast.success('Dihapus'); loadData() }
  }

  const handlePay = async (id: string) => {
    if (!payForm || !payForm.amount) return
    const amount = Number(payForm.amount)
    if (isNaN(amount) || amount <= 0) return
    const item = items.find(d => d.id === id)
    if (!item) return
    const newRemaining = Math.max(0, item.remaining_amount - amount)
    const isSettled = newRemaining <= 0
    const { error } = await supabase.from('debts').update({ remaining_amount: newRemaining, is_settled: isSettled }).eq('id', id)
    if (error) toast.error('Gagal mencatat pembayaran')
    else { toast.success(`Dicatat ${formatCurrency(amount)}`); setPayForm(null); loadData() }
  }

  const isDebt = form.type === 'debt'
  const totalDebt = items.filter(d => d.type === 'debt').reduce((s, d) => s + d.remaining_amount, 0)
  const totalReceivable = items.filter(d => d.type === 'receivable').reduce((s, d) => s + d.remaining_amount, 0)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl">Utang & Piutang</h1>
            <p className="text-sm">Lacak pinjaman, cicilan, dan tagihan</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', type: 'debt', total_amount: '', remaining_amount: '', interest_rate: '0', due_date: '', notes: '' }); setShowForm(true) }} className="btn btn-primary">
          <Plus size={18} /> Tambah
        </button>
      </div>

      {(totalDebt > 0 || totalReceivable > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>Total Utang</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totalDebt)}</h2>
          </div>
          <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Total Piutang</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(totalReceivable)}</h2>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Memuat...</p></div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CircleDollarSign size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Data</h3>
          <p style={{ marginBottom: '1rem' }}>Catat utang atau piutang Anda di sini.</p>
          <button onClick={() => { setEditing(null); setForm({ name: '', type: 'debt', total_amount: '', remaining_amount: '', interest_rate: '0', due_date: '', notes: '' }); setShowForm(true) }} className="btn btn-primary">
            <Plus size={16} /> Tambah
          </button>
        </div>
      ) : (
        <>
          {/* Utang */}
          {items.filter(d => d.type === 'debt').length > 0 && (
            <div className="card mb-6">
              <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Utang</h3>
              {renderList(items.filter(d => d.type === 'debt'))}
            </div>
          )}

          {/* Piutang */}
          {items.filter(d => d.type === 'receivable').length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Piutang</h3>
              {renderList(items.filter(d => d.type === 'receivable'))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{editing ? 'Edit' : 'Tambah'} {isDebt ? 'Utang' : 'Piutang'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setForm({ ...form, type: 'debt' })} className={`btn btn-secondary ${form.type === 'debt' ? 'btn-danger' : ''}`} style={{ flex: 1, padding: '0.5rem' }}>Utang</button>
                  <button type="button" onClick={() => setForm({ ...form, type: 'receivable' })} className={`btn btn-secondary ${form.type === 'receivable' ? 'btn-primary' : ''}`} style={{ flex: 1, padding: '0.5rem' }}>Piutang</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama / Keterangan</label>
                <input type="text" className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isDebt ? "Contoh: Pinjaman Bank" : "Contoh: Pinjaman ke Andi"} />
              </div>
              <div className="form-group">
                <label className="form-label">Total {isDebt ? 'Utang' : 'Piutang'} ({formatCurrency(Number(form.total_amount) || 0)})</label>
                <input type="number" className="form-input" required value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Sisa ({formatCurrency(Number(form.remaining_amount) || 0)})</label>
                <input type="number" className="form-input" value={form.remaining_amount} onChange={(e) => setForm({ ...form, remaining_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Bunga (%)</label>
                <input type="number" className="form-input" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Jatuh Tempo (opsional)</label>
                <input type="date" className="form-input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <input type="text" className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

  function renderList(list: Debt[]) {
    return (
      <div className="table-container" style={{ border: 'none' }}>
        <table className="table">
          <thead><tr><th>Nama</th><th>Total</th><th>Sisa</th><th>Bunga</th><th>Jatuh Tempo</th><th>Status</th><th style={{ width: '140px' }}>Aksi</th></tr></thead>
          <tbody>
            {list.map(d => {
              const progress = d.total_amount > 0 ? Math.round(((d.total_amount - d.remaining_amount) / d.total_amount) * 100) : 0
              return (
                <tr key={d.id} style={{ opacity: d.is_settled ? 0.5 : 1 }}>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(d.total_amount)}</td>
                  <td>
                    <span style={{ color: d.is_settled ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{formatCurrency(d.remaining_amount)}</span>
                    <div className="progress-container" style={{ height: 4, marginTop: '0.25rem' }}>
                      <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: d.is_settled ? 'var(--success)' : 'var(--primary)' }} />
                    </div>
                  </td>
                  <td>{d.interest_rate > 0 ? `${d.interest_rate}%` : '-'}</td>
                  <td>{d.due_date ? formatDate(d.due_date) : '-'}</td>
                  <td>
                    {d.is_settled
                      ? <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>Lunas</span>
                      : <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.85rem' }}>Aktif</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {!d.is_settled && (
                        <button onClick={() => setPayForm({ id: d.id, amount: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '0.25rem' }} title="Bayar"><TrendingUp size={16} /></button>
                      )}
                      <button onClick={() => openEdit(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(d.id, d.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                  {payForm?.id === d.id && (
                    <td colSpan={7} style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" className="form-input" style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }} placeholder="Jumlah bayar" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') handlePay(d.id) }} autoFocus />
                        <button onClick={() => handlePay(d.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}><Check size={14} /></button>
                        <button onClick={() => setPayForm(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}><X size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }
}
