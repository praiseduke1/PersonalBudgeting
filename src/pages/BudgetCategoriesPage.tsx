import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { BudgetCategory, Category } from '../types'
import toast from 'react-hot-toast'
import { PiggyBank, Plus, Pencil, X, Check, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, getCurrentMonth } from '../utils/format'
import { fetchCategories } from '../utils/supabase'

export default function BudgetCategoriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState<BudgetCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    const [budgetResult, catResult, txResult] = await Promise.all([
      supabase.from('budget_categories').select('*, categories(name)').eq('user_id', user.id).eq('month', selectedMonth),
      fetchCategories(user.id),
      supabase.from('transactions').select('amount, categories(type)').eq('user_id', user.id)
        .gte('transaction_date', selectedMonth + '-01')
        .lt('transaction_date', new Date(new Date(selectedMonth + '-01').getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    ])

    if (budgetResult.data) setBudgets(budgetResult.data as BudgetCategory[])
    setCategories(catResult.filter(c => c.type === 'expense'))
    if (txResult.data) setExpenseTotal(txResult.data.reduce((s: number, t: any) => s + Number(t.amount), 0))

    setLoading(false)
  }

  useEffect(() => { loadData() }, [user, selectedMonth])

  const handleSetBudget = async (categoryId: string) => {
    if (!user || !editValue) return
    const amount = Number(editValue)
    if (isNaN(amount) || amount < 0) return

    const existing = budgets.find(b => b.category_id === categoryId)
    const { error } = existing
      ? await supabase.from('budget_categories').update({ amount }).eq('id', existing.id)
      : await supabase.from('budget_categories').insert({ user_id: user.id, category_id: categoryId, amount, month: selectedMonth })

    if (error) toast.error('Gagal menyimpan: ' + error.message)
    else { toast.success('Anggaran tersimpan'); setEditing(null); loadData() }
  }

  const getExpenseForCategory = (catId: string): number => {
    return 0
  }

  const getBudgetAmount = (catId: string): number => {
    return budgets.find(b => b.category_id === catId)?.amount || 0
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl">Anggaran per Kategori</h1>
            <p className="text-sm">Alokasikan batas pengeluaran untuk setiap kategori</p>
          </div>
        </div>
        <input type="month" className="form-input" style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
          value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
      </div>

      {loading ? (
        <div className="card"><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Memuat...</p></div>
      ) : categories.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <PiggyBank size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Belum Ada Kategori Pengeluaran</h3>
          <p style={{ marginBottom: '1rem' }}>Buat kategori pengeluaran dulu di dashboard.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Anggaran</th>
                  <th>Progress</th>
                  <th style={{ width: '120px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const budgetAmount = getBudgetAmount(cat.id)
                  const hasBudget = budgetAmount > 0
                  return (
                    <tr key={cat.id}>
                      <td style={{ fontWeight: 500 }}>{cat.name}</td>
                      <td>
                        {editing === cat.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input type="number" className="form-input" style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                              value={editValue} onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSetBudget(cat.id); if (e.key === 'Escape') setEditing(null) }} autoFocus />
                            <button onClick={() => handleSetBudget(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '0.2rem' }}><Check size={16} /></button>
                            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 700 }}>{hasBudget ? formatCurrency(budgetAmount) : '-'}</span>
                        )}
                      </td>
                      <td>
                        {hasBudget ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-container" style={{ flex: 1, margin: 0 }}>
                              <div className="progress-bar" style={{
                                width: '0%',
                                backgroundColor: 'var(--primary)'
                              }} />
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>-</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Belum dialokasi</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => { setEditing(cat.id); setEditValue(budgetAmount.toString()) }}
                          className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                          {hasBudget ? 'Ubah' : 'Atur'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
