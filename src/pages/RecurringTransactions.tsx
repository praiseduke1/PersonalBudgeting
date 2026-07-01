import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Category, RecurringTransaction } from '../types'
import toast from 'react-hot-toast'
import { RotateCcw, Plus, Pencil, Trash2, X, Check, Loader2, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/format'
import { fetchCategories } from '../utils/supabase'

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan'
}

interface FormData {
  category_id: string
  amount: string
  type: 'income' | 'expense'
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_date: string
  end_date: string
}

const emptyForm: FormData = {
  category_id: '',
  amount: '',
  type: 'expense',
  description: '',
  frequency: 'monthly',
  next_date: new Date().toISOString().split('T')[0],
  end_date: ''
}

export default function RecurringTransactionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<RecurringTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const [txResult, catResult] = await Promise.all([
      supabase.from('recurring_transactions').select('*, categories(name)').eq('user_id', user.id).order('next_date', { ascending: true }),
      fetchCategories(user.id)
    ])
    if (txResult.error) toast.error('Gagal memuat data')
    else setItems(txResult.data as RecurringTransaction[])
    setCategories(catResult)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item: RecurringTransaction) => {
    setEditing(item)
    setForm({
      category_id: item.category_id,
      amount: item.amount.toString(),
      type: item.type,
      description: item.description || '',
      frequency: item.frequency,
      next_date: item.next_date,
      end_date: item.end_date || ''
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.category_id || !form.amount) return
    setSaving(true)

    const payload = {
      user_id: user.id,
      category_id: form.category_id,
      amount: Number(form.amount),
      type: form.type,
      description: form.description || null,
      frequency: form.frequency,
      next_date: form.next_date,
      end_date: form.end_date || null
    }

    const { error } = editing
      ? await supabase.from('recurring_transactions').update(payload).eq('id', editing.id)
      : await supabase.from('recurring_transactions').insert(payload)

    if (error) {
      toast.error('Gagal menyimpan: ' + error.message)
    } else {
      toast.success(editing ? 'Diperbarui' : 'Ditambahkan')
      setShowForm(false)
      loadData()
    }
    setSaving(false)
  }

  const handleToggleActive = async (item: RecurringTransaction) => {
    const { error } = await supabase.from('recurring_transactions').update({ is_active: !item.is_active }).eq('id', item.id)
    if (error) toast.error('Gagal mengubah status')
    else { toast.success(item.is_active ? 'Dinonaktifkan' : 'Diaktifkan'); loadData() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi berulang ini?')) return
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else { toast.success('Dihapus'); loadData() }
  }

  const filteredCategories = categories.filter(c => c.type === form.type)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl">Transaksi Berulang</h1>
            <p className="text-sm">Kelola tagihan dan pemasukan rutin</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn btn-primary whitespace-nowrap">
          <Plus size={18} /> Tambah
        </button>
      </div>

      {loading ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Memuat...</p></div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <RotateCcw size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Transaksi Berulang</h3>
          <p style={{ marginBottom: '1rem' }}>Tambahkan tagihan rutin atau pemasukan tetap Anda.</p>
          <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Tambah Pertama</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Deskripsi</th>
                  <th>Jumlah</th>
                  <th>Tipe</th>
                  <th>Frekuensi</th>
                  <th>Berikutnya</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{item.description || '-'}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                    <td>
                      <span style={{ color: item.type === 'income' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {item.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td>{FREQUENCY_LABELS[item.frequency]}</td>
                    <td>{formatDate(item.next_date)}</td>
                    <td>
                      <button onClick={() => handleToggleActive(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                        {item.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => openEdit(item)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{editing ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => { setForm({ ...form, type: 'expense', category_id: '' }) }}
                    className={`btn btn-secondary ${form.type === 'expense' ? 'btn-danger' : ''}`}
                    style={{ flex: 1, padding: '0.5rem' }}>Pengeluaran</button>
                  <button type="button" onClick={() => { setForm({ ...form, type: 'income', category_id: '' }) }}
                    className={`btn btn-secondary ${form.type === 'income' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, padding: '0.5rem' }}>Pemasukan</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah (Rp)</label>
                <input type="number" className="form-input" required value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-input" value={form.category_id} required
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Pilih kategori</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Frekuensi</label>
                <select className="form-input" value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}>
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Mulai</label>
                <input type="date" className="form-input" required value={form.next_date}
                  onChange={(e) => setForm({ ...form, next_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Berakhir (opsional)</label>
                <input type="date" className="form-input" value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <input type="text" className="form-input" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Tagihan listrik" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <><Loader2 size={16} className="pulse" /> Menyimpan...</> : <><Check size={16} /> {editing ? 'Simpan' : 'Tambah'}</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  <X size={16} /> Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
