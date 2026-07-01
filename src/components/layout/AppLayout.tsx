import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../dashboard/Sidebar'

export default function AppLayout() {
  const { user, profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={user}
        profile={profile}
        signOut={signOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main
        className="flex-1 min-w-0 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-app)' }}
      >
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </main>
    </div>
  )
}
