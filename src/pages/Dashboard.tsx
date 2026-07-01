import { useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { PlusCircle, Menu, Tags, Download } from 'lucide-react'
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
import { generateCSV, downloadFile, getCurrentMonth } from '../utils/format'

interface OutletContext {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const { setSidebarOpen } = useOutletContext<OutletContext>()
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<any>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())

  const { transactions, loading, loadingMore, hasMore, error, loadMore, refresh } = useTransactions(user?.id, selectedMonth)
  const { categories } = useCategories(user?.id)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense
  const actualBudget = profile?.monthly_budget ?? 2500000

  const handleExportCSV = useCallback(async () => {
    if (!user) return
    try {
      const rows = await exportTransactionsCSV(user.id, selectedMonth)
      if (rows.length === 0) {
        toast.error('Tidak ada transaksi untuk diexport')
        return
      }
      const headers = Object.keys(rows[0])
      const data = rows.map(r => headers.map(h => String((r as any)[h])))
      const csv = generateCSV(headers, data)
      downloadFile(csv, `transaksi-${selectedMonth}.csv`)
      toast.success(`Diexport ${rows.length} transaksi`)
    } catch (err: any) {
      toast.error('Gagal export: ' + err.message)
    }
  }, [user, selectedMonth])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}
            title="Export CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setShowCategoryManager(true)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}
            title="Atur Kategori"
          >
            <Tags size={18} />
          </button>
          <button
            onClick={() => { setEditingTx(null); setShowForm(true) }}
            className="btn btn-primary whitespace-nowrap"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Catat Transaksi</span>
          </button>
        </div>
      </header>

      {loading && transactions.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <>
          {error && <ErrorAlert message={error} onRetry={refresh} />}

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
