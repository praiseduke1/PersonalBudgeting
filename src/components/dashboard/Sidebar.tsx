import { useState, useEffect } from 'react'
import { Coins, Wallet, LogOut, User as UserIcon, Sun, Moon, X } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Profile } from '../../context/AuthContext'
import { toggleTheme } from '../../lib/theme'

interface SidebarProps {
  user: User
  profile: Profile | null
  signOut: () => Promise<void>
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ user, profile, signOut, isOpen, onClose }: SidebarProps) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const handleToggle = () => {
    toggleTheme()
    setIsDark(!isDark)
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 flex flex-col
          bg-[var(--bg-card)] border-r border-[var(--border)]
          p-6 justify-between
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ background: 'var(--primary-light)' }}>
                <Coins size={24} style={{ color: 'var(--primary)', display: 'block' }} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>FinancerSaaS</h2>
                <span className="text-xs block -mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Tenant: {profile?.full_name || user.email}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
              aria-label="Tutup sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            <a
              href="#"
              className="btn btn-secondary flex items-center gap-2"
              style={{ justifyContent: 'flex-start', background: 'var(--primary-light)', border: 'none', color: 'var(--primary)' }}
            >
              <Wallet size={18} /> Dashboard Utama
            </a>
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleToggle}
            className="btn btn-secondary btn-full justify-center mb-3"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Mode Terang' : 'Mode Gelap'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-main)' }}
            >
              <UserIcon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-main)' }}>
                {profile?.full_name || 'Tenant User'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="btn btn-secondary btn-full"
            style={{ color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
          >
            <LogOut size={16} /> Keluar Sesi
          </button>
        </div>
      </aside>
    </>
  )
}
