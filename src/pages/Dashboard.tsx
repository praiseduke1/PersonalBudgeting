import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { PlusCircle, RefreshCw, Menu } from 'lucide-react'
import ExpensePieChart from '../components/dashboard/ExpensePieChart'
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart'
import { Transaction, Category } from '../types'
import DashboardSkeleton from '../components/common/DashboardSkeleton'
import BudgetSection from '../components/dashboard/BudgetSection'
import SummaryCards from '../components/dashboard/SummaryCards'
import TransactionForm from '../components/dashboard/TransactionForm'
import TransactionTable from '../components/dashboard/TransactionTable'
import ErrorAlert from '../components/common/ErrorAlert'

interface OutletContext {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const { setSidebarOpen } = useOutletContext<OutletContext>()
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

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1 cursor-pointer flex-shrink-0"
            style={{ background: 'none', border: 'none', color: 'var(--text-main)' }}
            aria-label="Buka menu"
          >
            <Menu size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl">Dashboard Finansial</h1>
            <p className="text-sm">Selamat datang kembali! Lacak dan kelola anggaran bulanan Anda di sini.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <input
            type="month"
            className="form-input"
            style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button
            onClick={() => { setEditingTx(null); setShowForm(true) }}
            className="btn btn-primary whitespace-nowrap"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Catat Transaksi</span>
          </button>
        </div>
      </header>

      {/* Content */}
      {dataLoading && transactions.length === 0 && categories.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <>
          {dataLoading && (
            <div
              className="flex items-center gap-2 mb-4 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw className="pulse" size={16} /> Memuat data...
            </div>
          )}

          {fetchError && (
            <ErrorAlert message={fetchError} onRetry={() => fetchData()} />
          )}

          {user && (
            <BudgetSection
              userId={user.id}
              actualBudget={actualBudget}
              totalExpense={totalExpense}
              onBudgetUpdated={refreshProfile}
            />
          )}

          <SummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <ExpensePieChart transactions={transactions} />
            <MonthlyTrendChart userId={user?.id ?? ''} />
          </section>

          {showForm && (
            <TransactionForm
              userId={user?.id ?? ''}
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
      )}
    </div>
  )
}
