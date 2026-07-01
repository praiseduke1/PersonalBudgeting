import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabaseClient'
import toast from 'react-hot-toast'
import { PlusCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import ExpensePieChart from './components/dashboard/ExpensePieChart'
import MonthlyTrendChart from './components/dashboard/MonthlyTrendChart'
import { Transaction, Category } from './types'
import LoadingScreen from './components/common/LoadingScreen'
import DashboardSkeleton from './components/common/DashboardSkeleton'
import AuthForm from './components/common/AuthForm'
import Sidebar from './components/dashboard/Sidebar'
import BudgetSection from './components/dashboard/BudgetSection'
import SummaryCards from './components/dashboard/SummaryCards'
import TransactionForm from './components/dashboard/TransactionForm'
import TransactionTable from './components/dashboard/TransactionTable'
import ErrorAlert from './components/common/ErrorAlert'

export default function App() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const fetchData = useCallback(async (retries = 2) => {
    if (!user) return
    setDataLoading(true)
    setFetchError('')

    const startDate = selectedMonth + '-01'
    const endDate = new Date(new Date(startDate).getTime() + 31 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10)

    const [txResult, catResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(name, type)')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate)
        .lt('transaction_date', endDate)
        .order('transaction_date', { ascending: false })
        .limit(50),
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
    ])

    if (txResult.error) {
      if (retries > 0) {
        setTimeout(() => fetchData(retries - 1), 1500)
        return
      }
      setFetchError('Gagal memuat transaksi: ' + txResult.error.message)
      toast.error('Gagal memuat data transaksi')
    } else if (txResult.data) {
      setTransactions(txResult.data.map(t => ({
        id: t.id,
        type: (t.categories as any)?.type || 'expense',
        amount: Number(t.amount),
        category: (t.categories as any)?.name || 'Unknown',
        category_id: t.category_id,
        transaction_date: t.transaction_date,
        description: t.description
      })))
    }

    if (catResult.error) {
      setFetchError(prev => prev || 'Gagal memuat kategori')
      toast.error('Gagal memuat data kategori')
    } else if (catResult.data) {
      setCategories(catResult.data as Category[])
    }

    setDataLoading(false)
  }, [user, selectedMonth])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense
  const actualBudget = profile?.monthly_budget ?? 2500000

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className="app-container">
      <Sidebar user={user} profile={profile} signOut={signOut} />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Dashboard Finansial</h1>
            <p>Selamat datang kembali! Lacak dan kelola anggaran bulanan Anda di sini.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type="month" className="form-input"
              style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)} />
            <button onClick={() => { setEditingTx(null); setShowForm(true); }} className="btn btn-primary">
              <PlusCircle size={18} /> Catat Transaksi
            </button>
          </div>
        </header>

        {dataLoading && transactions.length === 0 && categories.length === 0 ? (
          <DashboardSkeleton />
        ) : (
          <>
            {dataLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <RefreshCw className="pulse" size={16} /> Memuat data...
              </div>
            )}

            {fetchError && (
              <ErrorAlert message={fetchError} onRetry={() => fetchData()} />
            )}

            <BudgetSection
              userId={user.id}
              actualBudget={actualBudget}
              totalExpense={totalExpense}
              onBudgetUpdated={refreshProfile}
            />

            <SummaryCards
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
            />

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <ExpensePieChart transactions={transactions} />
              <MonthlyTrendChart userId={user.id} />
            </section>

            {showForm && (
              <TransactionForm
                userId={user.id}
                categories={categories}
                editTransaction={editingTx}
                onSaved={() => { setShowForm(false); setEditingTx(null); fetchData() }}
                onClose={() => { setShowForm(false); setEditingTx(null) }}
              />
            )}

            <TransactionTable
              transactions={transactions}
              onEdit={(t) => { setEditingTx(t); setShowForm(true) }}
              onDelete={async (id) => {
                if (!confirm('Hapus transaksi ini?')) return
                const { error } = await supabase.from('transactions').delete().eq('id', id)
                if (error) {
                  toast.error('Gagal menghapus: ' + error.message)
                } else {
                  toast.success('Transaksi dihapus')
                  fetchData()
                }
              }}
            />
          </>
        )}</main>
    </div>
  )
}
