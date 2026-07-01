import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { User, Lock, Save, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/format'

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [monthlyBudget, setMonthlyBudget] = useState(profile?.monthly_budget?.toString() || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)

    const updateData: any = {}
    if (fullName.trim()) updateData.full_name = fullName.trim()
    if (monthlyBudget) updateData.monthly_budget = Number(monthlyBudget)

    const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id)
    if (error) {
      toast.error('Gagal memperbarui profil: ' + error.message)
    } else {
      toast.success('Profil diperbarui')
      await refreshProfile()
    }
    setSavingProfile(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error('Gagal mengubah password: ' + error.message)
    } else {
      toast.success('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
    }
    setSavingPassword(false)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.75rem', lineHeight: 0 }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl">Pengaturan</h1>
          <p className="text-sm">Kelola profil dan keamanan akun Anda</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} style={{ color: 'var(--primary)' }} />
          <h3>Profil Tenant</h3>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
        </div>

        <div className="form-group">
          <label className="form-label">Nama Lengkap</label>
          <input type="text" className="form-input" value={fullName}
            onChange={(e) => setFullName(e.target.value)} placeholder="Nama Anda" />
        </div>

        <div className="form-group">
          <label className="form-label">Anggaran Bulanan ({formatCurrency(Number(monthlyBudget) || 0)})</label>
          <input type="number" className="form-input" value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)} placeholder="2500000" />
        </div>

        <button type="submit" className="btn btn-primary" disabled={savingProfile}>
          {savingProfile ? <><Loader2 size={16} className="pulse" /> Menyimpan...</> : <><Save size={16} /> Simpan Profil</>}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={20} style={{ color: 'var(--primary)' }} />
          <h3>Ubah Kata Sandi</h3>
        </div>

        <div className="form-group">
          <label className="form-label">Password Baru</label>
          <input type="password" className="form-input" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={savingPassword || !newPassword}>
          {savingPassword ? <><Loader2 size={16} className="pulse" /> Mengubah...</> : <><Lock size={16} /> Ubah Password</>}
        </button>
      </form>
    </div>
  )
}
