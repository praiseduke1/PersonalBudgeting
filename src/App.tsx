import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoadingScreen from './components/common/LoadingScreen'
import AuthForm from './components/common/AuthForm'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import RecurringTransactionsPage from './pages/RecurringTransactions'
import GoalsPage from './pages/Goals'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="recurring" element={<RecurringTransactionsPage />} />
        <Route path="goals" element={<GoalsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
