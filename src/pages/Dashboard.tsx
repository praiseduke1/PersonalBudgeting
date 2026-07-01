import { useState, useCallback, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { PlusCircle, Menu, Tags, Download, BarChart3, PiggyBank } from 'lucide-react'
import ExpensePieChart from '../components/dashboard/ExpensePieChart'
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart'
import BudgetSection from '../components/dashboard/BudgetSection'
import SummaryCards from '../components/dashboard/SummaryCards'
import TransactionForm from '../components/dashboard/TransactionForm'
import TransactionTable from '../components/dashboard/TransactionTable'
import CategoryManager from '../components/dashboard/CategoryManager'
import ErrorAlert from '../components/common/ErrorAlert'
import DashboardSkeleton from '../components/common/DashboardSkeleton'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { exportTransactionsCSV } from '../utils/supabase'
import { generateCSV, downloadFile, getCurrentMonth, formatCurrency } from '../utils/format'
import { useNavigate } from 'react-router-dom'

interface OutletContext {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const { setSidebarOpen } = useOutletContext<OutletContext>()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<any>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [netWorth, setNetWorth] = useState<{ total_assets: number; total_liabilities: number; net_worth: number } | null>(null)

  const { transactions, loading, loadingMore, hasMore, error, loadMore, refresh } = useTransactions(user?.id, selectedMonth)
  const { categories } = useCategories(user?.id)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense
  const actualBudget = profile?.monthly_budget ?? 2500000

  useEffect(() => {
    if (!user) return
    const fetchNetWorth = async () => {
      const [accResult, invResult, debtResult] = await Promise.all([
        supabase.from('accounts').select('balance').eq('user_id', user.id),
        supabase.from('investments').select('current_value').eq('user_id', user.id),
        supabase.from('debts').select('remaining_amount, type').eq('user_id', user.id).eq('is_settled', false)
      ])
      const totalAssets = (accResult.data || []).reduce((s: number, a: any) => s + Number(a.balance), 0) +
        (invResult.data || []).reduce((s: number, i: any) => s + Number(i.current_value), 0)
      const receivables = (debtResult.data || []).filter((d: any) => d.type === 'receivable').reduce((s: number, d: any) => s + Number(d.remaining_amount), 0)
      const debts = (debtResult.data || []).filter((d: any) => d.type === 'debt').reduce((s: number, d: any) => s + Number(d.remaining_amount), 0)
      setNetWorth({ total_assets: totalAssets + receivables, total_liabilities: debts, net_worth: (totalAssets + receivables) - debts })
    }
    fetchNetWorth()
  }, [user])

  const handleExportCSV = useCallback(async () => {
    if (!user) return
    try {
      const rows = await exportTransactionsCSV(user.id, selectedMonth)
      if (rows.length === 0) { toast.error('Tidak ada transaksi untuk diexport'); return }
      const headers = Object.keys(rows[0])
      const data = rows.map(r => headers.map(h => String((r as any)[h])))
      const csv = generateCSV(headers, data)
      downloadFile(csv, `transaksi-${selectedMonth}.csv`)
      toast.success(`Diexport ${rows.length} transaksi`)
    } catch (err: any) { toast.error('Gagal export: ' + err.message) }
  }, [user, selectedMonth])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 cursor-pointer flex-shrink-0"
            style={{ background: 'none', border: 'none', color: 'var(--text-main)' }} aria-label="Buka menu">
            <Menu size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl">Dashboard Finansial</h1>
            <p className="text-sm">Selamat datang kembali! Lacak dan kelola anggaran bulanan Anda di sini.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <input type="month" className="form-input" style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
            value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }} title="Export CSV">
            <Download size={18} />
          </button>
          <button onClick={() => setShowCategoryManager(true)} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }} title="Atur Kategori">
            <Tags size={18} />
          </button>
          <button onClick={() => { setEditingTx(null); setShowForm(true) }} className="btn btn-primary whitespace-nowrap">
            <PlusCircle size={18} /> <span className="hidden sm:inline">Catat Transaksi</span>
          </button>
        </div>
      </header>

      {loading && transactions.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <>
          {error && <ErrorAlert message={error} onRetry={refresh} />}

          {/* Net Worth Summary Card */}
          {netWorth && (
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/net-worth')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <BarChart3 size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Aset</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(netWorth.total_assets)}</h3>
              </div>
              <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/net-worth')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <BarChart3 size={16} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Liabilitas</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(netWorth.total_liabilities)}</h3>
              </div>
              <div className="card" style={{ cursor: 'pointer', borderLeft: `4px solid ${netWorth.net_worth >= 0 ? 'var(--success)' : 'var(--danger)'}` }} onClick={() => navigate('/net-worth')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <BarChart3 size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Net Worth</span>
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: netWorth.net_worth >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(netWorth.net_worth)}</h3>
              </div>
            </section>
          )}

          {user && (
            <BudgetSection
              userId={user.id}
              actualBudget={actualBudget}
              totalExpense={totalExpense}
              onBudgetUpdated={refreshProfile}
            />
          )}

          <SummaryCards totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} />

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <ExpensePieChart transactions={transactions} />
            <MonthlyTrendChart userId={user?.id ?? ''} />
          </section>

          {showForm && (
            <TransactionForm
              userId={user?.id ?? ''}
              categories={categories}
              editTransaction={editingTx}
              onSaved={() => { setShowForm(false); setEditingTx(null); refresh() }}
              onClose={() => { setShowForm(false); setEditingTx(null) }}
            />
          )}

          {showCategoryManager && (
            <CategoryManager
              categories={categories}
              userId={user?.id ?? ''}
              onRefresh={refresh}
              onClose={() => setShowCategoryManager(false)}
            />
          )}

          <TransactionTable
            transactions={transactions}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onEdit={(t) => { setEditingTx(t); setShowForm(true) }}
            onDelete={async (id) => {
              if (!confirm('Hapus transaksi ini?')) return
              const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single()
              if (tx && tx.account_id) {
                const reverseChange = tx.type === 'income' ? -tx.amount : tx.amount
                const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).single()
                if (acc) {
                  await supabase.from('accounts').update({ balance: Number(acc.balance) + reverseChange }).eq('id', tx.account_id)
                }
              }
              const { error } = await supabase.from('transactions').delete().eq('id', id)
              if (error) toast.error('Gagal menghapus: ' + error.message)
              else { toast.success('Transaksi dihapus'); refresh() }
            }}
          />
        </>
      )}
    </div>
  )
}
