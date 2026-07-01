import React from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Coins } from 'lucide-react'

interface AuthFormProps {
  onAuthSuccess?: () => void
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isRegister, setIsRegister] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        })
        if (signUpError) throw signUpError
        setSuccess('Registrasi berhasil! Silakan cek email Anda untuk verifikasi atau masuk ke akun Anda.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        onAuthSuccess?.()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%' }}>
            <Coins size={32} style={{ color: 'var(--primary)', display: 'block' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>FinancerSaaS</h2>
            <p style={{ fontSize: '0.8rem', marginTop: '-2px' }}>Multi-Tenant Personal Budgeting</p>
          </div>
        </div>

        <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
          {isRegister ? 'Buat Akun Baru' : 'Masuk ke Aplikasi'}
        </h3>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {isRegister ? 'Daftar sebagai tenant baru dan mulai lacak keuangan.' : 'Akses dashboard finansial pribadi terisolasi Anda.'}
        </p>

        {error && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input type="text" className="form-input" placeholder="John Doe" required
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input type="email" className="form-input" placeholder="nama@perusahaan.com" required
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <input type="password" className="form-input" placeholder="••••••••" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Memproses...' : isRegister ? 'Mulai Registrasi' : 'Masuk Sekarang'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akun tenant?'}
          </span>{' '}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegister ? 'Masuk' : 'Daftar Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}
