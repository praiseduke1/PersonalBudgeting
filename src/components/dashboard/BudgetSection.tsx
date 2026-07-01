import React from 'react'
import { supabase } from '../../lib/supabaseClient'
import { AlertTriangle } from 'lucide-react'

interface BudgetSectionProps {
  userId: string
  actualBudget: number
  totalExpense: number
  onBudgetUpdated: () => void
}

export default function BudgetSection({ userId, actualBudget, totalExpense, onBudgetUpdated }: BudgetSectionProps) {
  const [editing, setEditing] = React.useState(false)
  const [tempBudget, setTempBudget] = React.useState('')

  const budgetPercentage = Math.min(Math.round((totalExpense / actualBudget) * 100), 100)
  const balance = 0 // not used here

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'var(--danger)'
    if (percentage >= 70) return 'var(--warning)'
    return 'var(--primary)'
  }

  const handleUpdateBudget = async () => {
    const val = Number(tempBudget)
    if (isNaN(val) || val < 0) return

    const { error } = await supabase
      .from('profiles')
      .update({ monthly_budget: val })
      .eq('id', userId)

    if (!error) {
      setEditing(false)
      onBudgetUpdated()
    }
  }

  return (
    <section className="card card-premium" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Batas Pengeluaran Bulanan (Limit Tracker)
          </span>
          {editing ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Rp</span>
              <input type="number" className="form-input"
                style={{ width: '150px', padding: '0.25rem 0.5rem' }}
                value={tempBudget} onChange={(e) => setTempBudget(e.target.value)} />
              <button onClick={handleUpdateBudget} className="btn btn-primary"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>Simpan</button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>Batal</button>
            </div>
          ) : (
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
              Rp {actualBudget.toLocaleString('id-ID')}
              <button onClick={() => { setTempBudget(actualBudget.toString()); setEditing(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Ubah
              </button>
            </h2>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Terpakai</span>
          <h3 style={{ fontSize: '1.25rem', color: totalExpense > actualBudget ? 'var(--danger)' : 'var(--text-main)', marginTop: '0.25rem' }}>
            Rp {totalExpense.toLocaleString('id-ID')} ({budgetPercentage}%)
          </h3>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar"
          style={{ width: `${budgetPercentage}%`, backgroundColor: getProgressBarColor(budgetPercentage) }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.5rem' }}>
        <span>Sisa Anggaran: <strong style={{ color: (actualBudget - totalExpense) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          Rp {(actualBudget - totalExpense).toLocaleString('id-ID')}
        </strong></span>
        {budgetPercentage >= 90 && (
          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
            <AlertTriangle size={14} /> Peringatan: Anggaran hampir habis!
          </span>
        )}
      </div>
    </section>
  )
}
