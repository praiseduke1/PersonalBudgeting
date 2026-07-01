import { useEffect, useState } from 'react'
import { Coins, Wallet, LogOut, User as UserIcon, Sun, Moon, X } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Profile } from '../../context/AuthContext'
import { toggleTheme } from '../../lib/theme'

interface SidebarProps {
  user: User
  profile: Profile | null
  signOut: () => Promise<void>
  open: boolean
  onClose: () => void
}

export default function Sidebar({ user, profile, signOut, open, onClose }: SidebarProps) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const handleToggle = () => {
    toggleTheme()
    setIsDark(!isDark)
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%' }}>
            <Coins size={24} style={{ color: 'var(--primary)', display: 'block' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>FinancerSaaS</h2>
            <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', marginTop: '-4px' }}>
              Tenant: {profile?.full_name || user.email}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="btn btn-icon sidebar-close-btn"
          aria-label="Tutup sidebar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'none' }}>
          <X size={20} />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <a href="#" className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', background: 'var(--primary-light)', border: 'none', color: 'var(--primary)' }}>
          <Wallet size={18} /> Dashboard Utama
        </a>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <button onClick={handleToggle} className="btn btn-secondary btn-full"
          style={{ marginBottom: '0.75rem', justifyContent: 'center' }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? 'Mode Terang' : 'Mode Gelap'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            background: 'var(--border)', width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)'
          }}>
            <UserIcon size={18} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Tenant User'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </p>
          </div>
        </div>
        <button onClick={signOut} className="btn btn-secondary btn-full"
          style={{ color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
          <LogOut size={16} /> Keluar Sesi
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={{
        width: '280px',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {content}
      </aside>

      {/* Mobile sidebar */}
      <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`sidebar-mobile${open ? ' open' : ''}`} style={{
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%' }}>
              <Coins size={24} style={{ color: 'var(--primary)', display: 'block' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>FinancerSaaS</h2>
              <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', marginTop: '-4px' }}>
                Tenant: {profile?.full_name || user.email}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-icon"
            aria-label="Tutup sidebar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="#" className="btn btn-secondary"
            style={{ justifyContent: 'flex-start', background: 'var(--primary-light)', border: 'none', color: 'var(--primary)' }}>
            <Wallet size={18} /> Dashboard Utama
          </a>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <button onClick={handleToggle} className="btn btn-secondary btn-full"
            style={{ marginBottom: '0.75rem', justifyContent: 'center' }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? 'Mode Terang' : 'Mode Gelap'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              background: 'var(--border)', width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)'
            }}>
              <UserIcon size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Tenant User'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          </div>
          <button onClick={signOut} className="btn btn-secondary btn-full"
            style={{ color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
            <LogOut size={16} /> Keluar Sesi
          </button>
        </div>
      </aside>
    </>
  )
}
