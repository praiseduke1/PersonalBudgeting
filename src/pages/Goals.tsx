import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { FinancialGoal } from '../types'
import toast from 'react-hot-toast'
import { Target, Plus, Pencil, Trash2, X, Check, Loader2, TrendingUp, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/format'

const ICON_OPTIONS = [
  { value: 'target', label: 'Target' },
  { value: 'home', label: 'Rumah' },
  { value: 'car', label: 'Mobil' },
  { value: 'plane', label: 'Liburan' },
  { value: 'graduation', label: 'Pendidikan' },
  { value: 'heart', label: 'Kesehatan' },
  { value: 'shopping', label: 'Belanja' },
  { value: 'piggy', label: 'Tabungan' }
]

const COLOR_OPTIONS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

interface FormData {
  name: string
  target_amount: string
  current_amount: string
  deadline: string
  icon: string
  color: string
}

const emptyForm: FormData = {
  name: '',
  target_amount: '',
  current_amount: '0',
  deadline: '',
  icon: 'target',
  color: '#6366f1'
}

export default function GoalsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FinancialGoal | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [topUp, setTopUp] = useState<{ id: string; amount: string } | null>(null)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) toast.error('Gagal memuat target')
    else setGoals(data as FinancialGoal[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (g: FinancialGoal) => {
    setEditing(g)
    setForm({
      name: g.name,
      target_amount: g.target_amount.toString(),
      current_amount: g.current_amount.toString(),
      deadline: g.deadline || '',
      icon: g.icon,
      color: g.color
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.name || !form.target_amount) return
    setSaving(true)

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount),
      deadline: form.deadline || null,
      icon: form.icon,
      color: form.color
    }

    const { error } = editing
      ? await supabase.from('financial_goals').update(payload).eq('id', editing.id)
      : await supabase.from('financial_goals').insert(payload)

    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else {
      toast.success(editing ? 'Target diperbarui' : 'Target ditambahkan')
      setShowForm(false)
      loadData()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus target ini?')) return
    const { error } = await supabase.from('financial_goals').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else { toast.success('Target dihapus'); loadData() }
  }

  const handleTopUp = async (id: string) => {
    if (!topUp || !topUp.amount) return
    const amount = Number(topUp.amount)
    if (isNaN(amount) || amount <= 0) return

    const goal = goals.find(g => g.id === id)
    if (!goal) return

    const newCurrent = goal.current_amount + amount
    const isCompleted = newCurrent >= goal.target_amount

    const { error } = await supabase
      .from('financial_goals')
      .update({ current_amount: newCurrent, is_completed: isCompleted })
      .eq('id', id)

    if (error) toast.error('Gagal menambah dana')
    else {
      toast.success(`Ditambahkan ${formatCurrency(amount)} ke target`)
      setTopUp(null)
      loadData()
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl">Target Finansial</h1>
            <p className="text-sm">Tetapkan dan lacak tujuan keuangan Anda</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn btn-primary whitespace-nowrap">
          <Plus size={18} /> Tambah Target
        </button>
      </div>

      {loading ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Memuat...</p></div>
      ) : goals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Target size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Target Finansial</h3>
          <p style={{ marginBottom: '1rem' }}>Buat target tabungan pertama Anda.</p>
          <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Buat Target</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {goals.map(goal => {
            const percentage = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
            const isComplete = goal.is_completed || percentage >= 100

            return (
              <div key={goal.id} className="card" style={{
                borderColor: isComplete ? 'var(--success)' : goal.color + '40',
                borderLeft: `4px solid ${isComplete ? 'var(--success)' : goal.color}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: goal.color + '20', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: goal.color
                    }}>
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem' }}>{goal.name}</h3>
                      {goal.deadline && (
                        <p style={{ fontSize: '0.8rem' }}>Target: {formatDate(goal.deadline)}</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEdit(goal)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="progress-container">
                  <div className="progress-bar"
                    style={{ width: `${percentage}%`, backgroundColor: isComplete ? 'var(--success)' : goal.color }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(goal.current_amount)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(goal.target_amount)}</span>
                </div>

                {isComplete ? (
                  <div style={{
                    marginTop: '0.75rem', background: 'var(--success-light)',
                    color: 'var(--success)', padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                    textAlign: 'center', fontWeight: 600, fontSize: '0.85rem'
                  }}>
                    <Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    Target Tercapai!
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem' }}>
                    {topUp?.id === goal.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" className="form-input" style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                          placeholder="Jumlah" value={topUp.amount}
                          onChange={(e) => setTopUp({ ...topUp, amount: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleTopUp(goal.id) }} autoFocus />
                        <button onClick={() => handleTopUp(goal.id)} className="btn btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                          <TrendingUp size={14} />
                        </button>
                        <button onClick={() => setTopUp(null)} className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setTopUp({ id: goal.id, amount: '' })}
                        className="btn btn-secondary btn-full" style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                        <TrendingUp size={14} /> Tambah Dana
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{editing ? 'Edit Target' : 'Tambah Target Baru'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nama Target</label>
                <input type="text" className="form-input" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: DP Rumah" />
              </div>
              <div className="form-group">
                <label className="form-label">Target ({formatCurrency(Number(form.target_amount) || 0)})</label>
                <input type="number" className="form-input" required value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Dana Saat Ini ({formatCurrency(Number(form.current_amount) || 0)})</label>
                <input type="number" className="form-input" value={form.current_amount}
                  onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Batas Waktu (opsional)</label>
                <input type="date" className="form-input" value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Warna</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text-main)' : '3px solid transparent',
                        cursor: 'pointer'
                      }} />
                  ))}
                </div>
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
