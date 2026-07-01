import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoadingScreen from './components/common/LoadingScreen'
import AuthForm from './components/common/AuthForm'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import RecurringTransactionsPage from './pages/RecurringTransactions'
import GoalsPage from './pages/Goals'
import AccountsPage from './pages/Accounts'
import InvestmentsPage from './pages/Investments'
import DebtsPage from './pages/Debts'
import NetWorthPage from './pages/NetWorth'
import BudgetCategoriesPage from './pages/BudgetCategoriesPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <AuthForm />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="recurring" element={<RecurringTransactionsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="debts" element={<DebtsPage />} />
        <Route path="net-worth" element={<NetWorthPage />} />
        <Route path="budget-categories" element={<BudgetCategoriesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
