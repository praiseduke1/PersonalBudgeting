import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Account, AccountTransfer, Category } from '../types'
import toast from 'react-hot-toast'
import { Wallet, Plus, Pencil, Trash2, X, Check, Loader2, ArrowLeft, Send, Ban } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/format'

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Tunai' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'savings', label: 'Tabungan' },
  { value: 'other', label: 'Lainnya' }
]

const ACCOUNT_ICONS: Record<string, string> = {
  cash: 'wallet', bank: 'landmark', ewallet: 'smartphone', savings: 'piggy', other: 'circle'
}

export default function AccountsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transfers, setTransfers] = useState<AccountTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'bank' as Account['type'], balance: '', color: '#6366f1' })
  const [transferForm, setTransferForm] = useState({ from_account_id: '', to_account_id: '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const [accResult, trfResult] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id).order('name'),
      supabase.from('account_transfers').select('*').eq('user_id', user.id).order('transfer_date', { ascending: false }).limit(20)
    ])
    if (accResult.error) toast.error('Gagal memuat akun')
    else setAccounts(accResult.data as Account[])
    if (trfResult.error) toast.error('Gagal memuat transfer')
    else setTransfers(trfResult.data as AccountTransfer[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user])

  const openEdit = (a: Account) => {
    setEditing(a)
    setForm({ name: a.name, type: a.type, balance: a.balance.toString(), color: a.color })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.name) return
    setSaving(true)
    const payload = { user_id: user.id, name: form.name.trim(), type: form.type, balance: Number(form.balance) || 0, color: form.color }
    const { error } = editing
      ? await supabase.from('accounts').update(payload).eq('id', editing.id)
      : await supabase.from('accounts').insert(payload)
    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else { toast.success(editing ? 'Akun diperbarui' : 'Akun ditambahkan'); setShowForm(false); loadData() }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('account_id', id)
    if (count && count > 0) {
      if (!confirm(`Akun "${name}" memiliki ${count} transaksi. Hapus?`)) return
    } else {
      if (!confirm(`Hapus akun "${name}"?`)) return
    }
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else { toast.success('Akun dihapus'); loadData() }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) return
    if (transferForm.from_account_id === transferForm.to_account_id) { toast.error('Akun asal dan tujuan harus berbeda'); return }
    setSaving(true)
    const amount = Number(transferForm.amount)
    const { error } = await supabase.rpc('transfer_between_accounts', {
      p_user_id: user.id,
      p_from_account_id: transferForm.from_account_id,
      p_to_account_id: transferForm.to_account_id,
      p_amount: amount,
      p_description: transferForm.description || null,
      p_transfer_date: transferForm.transfer_date
    })
    if (error) {
      const { error: directError } = await supabase.from('account_transfers').insert({
        user_id: user.id, from_account_id: transferForm.from_account_id, to_account_id: transferForm.to_account_id,
        amount, description: transferForm.description || null, transfer_date: transferForm.transfer_date
      })
      if (directError) { toast.error('Gagal transfer: ' + directError.message); setSaving(false); return }
      await supabase.rpc('update_account_balance', { p_account_id: transferForm.from_account_id, p_amount: -amount })
      await supabase.rpc('update_account_balance', { p_account_id: transferForm.to_account_id, p_amount: amount })
    }
    toast.success('Transfer berhasil')
    setShowTransfer(false)
    setTransferForm({ from_account_id: '', to_account_id: '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] })
    setSaving(false)
    loadData()
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl">Akun & Rekening</h1>
            <p className="text-sm">Kelola saldo tunai, bank, e-wallet, dan tabungan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTransfer(true)} className="btn btn-secondary">
            <Send size={16} /> Transfer
          </button>
          <button onClick={() => { setEditing(null); setForm({ name: '', type: 'bank', balance: '', color: '#6366f1' }); setShowForm(true) }} className="btn btn-primary">
            <Plus size={18} /> Tambah Akun
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Memuat...</p></div>
      ) : accounts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Wallet size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Akun</h3>
          <p style={{ marginBottom: '1rem' }}>Buat akun untuk mulai melacak saldo Anda.</p>
          <button onClick={() => { setEditing(null); setForm({ name: '', type: 'bank', balance: '', color: '#6366f1' }); setShowForm(true) }} className="btn btn-primary">
            <Plus size={16} /> Buat Akun
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} className="card" style={{ borderLeft: `4px solid ${acc.color}`, opacity: acc.is_active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>
                      {ACCOUNT_TYPES.find(t => t.value === acc.type)?.label}
                    </span>
                    <h3 style={{ fontSize: '1rem', marginTop: '0.1rem' }}>{acc.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEdit(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(acc.id, acc.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: acc.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatCurrency(acc.balance)}
                </h2>
              </div>
            ))}
          </div>

          {transfers.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Riwayat Transfer</h3>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="table">
                  <thead><tr><th>Tanggal</th><th>Dari</th><th>Ke</th><th>Jumlah</th><th>Keterangan</th></tr></thead>
                  <tbody>
                    {transfers.map(t => {
                      const from = accounts.find(a => a.id === t.from_account_id)
                      const to = accounts.find(a => a.id === t.to_account_id)
                      return (
                        <tr key={t.id}>
                          <td>{formatDate(t.transfer_date)}</td>
                          <td style={{ color: 'var(--danger)' }}>{from?.name || 'Unknown'}</td>
                          <td style={{ color: 'var(--success)' }}>{to?.name || 'Unknown'}</td>
                          <td style={{ fontWeight: 700 }}>{formatCurrency(t.amount)}</td>
                          <td>{t.description || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{editing ? 'Edit Akun' : 'Tambah Akun'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nama Akun</label>
                <input type="text" className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: BCA Xpress" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Saldo Awal ({formatCurrency(Number(form.balance) || 0)})</label>
                <input type="number" className="form-input" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Warna</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'].map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text-main)' : '3px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
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

      {showTransfer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Transfer Antar Akun</h3>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">Dari Akun</label>
                <select className="form-input" required value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}>
                  <option value="">Pilih akun asal</option>
                  {accounts.filter(a => a.is_active && a.id !== transferForm.to_account_id).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ke Akun</label>
                <select className="form-input" required value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}>
                  <option value="">Pilih akun tujuan</option>
                  {accounts.filter(a => a.is_active && a.id !== transferForm.from_account_id).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah ({formatCurrency(Number(transferForm.amount) || 0)})</label>
                <input type="number" className="form-input" required value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal</label>
                <input type="date" className="form-input" required value={transferForm.transfer_date} onChange={(e) => setTransferForm({ ...transferForm, transfer_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Keterangan (opsional)</label>
                <input type="text" className="form-input" value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })} placeholder="Contoh: Transfer ke tabungan" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <><Loader2 size={16} className="pulse" /> Memproses...</> : <><Send size={16} /> Transfer</>}
                </button>
                <button type="button" onClick={() => setShowTransfer(false)} className="btn btn-secondary"><Ban size={16} /> Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
