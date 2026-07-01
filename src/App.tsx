import React, { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PlusCircle, 
  LogOut, 
  User as UserIcon, 
  AlertTriangle,
  RefreshCw,
  FolderPlus,
  Coins
} from 'lucide-react'

// Mock Data untuk Demo Mode jika Supabase belum terhubung atau dalam mode sandbox
const MOCK_TRANSACTIONS = [
  { id: '1', type: 'expense', amount: 150000, category: 'Makanan', transaction_date: '2026-06-02', description: 'Makan siang Nasi Padang' },
  { id: '2', type: 'income', amount: 5000000, category: 'Gaji', transaction_date: '2026-06-01', description: 'Gaji Bulanan Utama' },
  { id: '3', type: 'expense', amount: 200000, category: 'Transportasi', transaction_date: '2026-05-31', description: 'Bensin & Tol' },
  { id: '4', type: 'expense', amount: 350000, category: 'Belanja', transaction_date: '2026-05-30', description: 'Belanja bulanan minimarket' },
]

const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Makanan', type: 'expense' },
  { id: 'c2', name: 'Gaji', type: 'income' },
  { id: 'c3', name: 'Transportasi', type: 'expense' },
  { id: 'c4', name: 'Belanja', type: 'expense' },
]

export default function App() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  
  // State untuk Auth Form
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authSuccess, setAuthSuccess] = useState('')

  // State untuk Input Transaksi Baru (Demo / Live)
  const [showAddForm, setShowAddForm] = useState(false)
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('Makanan')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txDesc, setTxDesc] = useState('')
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS)
  
  // Settings & Budget State
  const [monthlyBudget, setMonthlyBudget] = useState(2500000) // Default 2.5jt
  const [editingBudget, setEditingBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState('2500000')

  // Cek apakah Supabase terhubung dengan kredensial real
  const isSupabasePlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder-url') || !import.meta.env.VITE_SUPABASE_URL

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)

    if (isSupabasePlaceholder) {
      // Mock Authentication untuk Demo Mode
      setTimeout(() => {
        setAuthLoading(false)
        setAuthSuccess('Demo Mode Aktif! Hubungkan Supabase Anda untuk menyimpan data secara permanen.')
        // Auto-login di demo mode setelah beberapa detik
        alert('Anda sedang menggunakan Demo Mode karena Supabase URL belum dikonfigurasi. Menampilkan dashboard demo...')
        window.location.reload()
      }, 1000)
      return
    }

    try {
      if (isRegister) {
        // Sign Up dengan metadata nama lengkap
        const { error } = await import('./lib/supabaseClient').then(m => m.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        }))
        if (error) throw error
        setAuthSuccess('Registrasi berhasil! Silakan cek email Anda untuk verifikasi konfirmasi (jika diaktifkan) atau masuk ke akun Anda.')
      } else {
        // Sign In
        const { error } = await import('./lib/supabaseClient').then(m => m.supabase.auth.signInWithPassword({
          email,
          password,
        }))
        if (error) throw error
      }
    } catch (err: any) {
      setAuthError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAmount || isNaN(Number(txAmount))) return

    const newTx = {
      id: Math.random().toString(),
      type: txType,
      amount: Number(txAmount),
      category: txCategory,
      transaction_date: txDate,
      description: txDesc
    }

    setTransactions([newTx, ...transactions])
    setTxAmount('')
    setTxDesc('')
    setShowAddForm(false)
  }

  const handleUpdateBudget = () => {
    const val = Number(tempBudget)
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudget(val)
      setEditingBudget(false)
    }
  }

  // Kalkulasi Ringkasan Finansial
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense
  const actualBudget = profile?.monthly_budget ?? monthlyBudget
  const budgetPercentage = Math.min(Math.round((totalExpense / actualBudget) * 100), 100)

  // Tentukan warna progress bar berdasarkan persentase anggaran yang terpakai
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'var(--danger)'
    if (percentage >= 70) return 'var(--warning)'
    return 'var(--primary)'
  }

  if (loading) {
    return (
      <div className="auth-layout">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <RefreshCw className="pulse" size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <p>Memuat profil tenant dan konfigurasi sesi...</p>
        </div>
      </div>
    )
  }

  // JIKA BELUM LOGIN (DAN BUKAN DEMO MODE DENGAN MOCK)
  // Catatan: Jika session kosong, tampilkan form login
  if (!user) {
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

          {isSupabasePlaceholder && (
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              borderRadius: 'var(--radius-md)', 
              padding: '0.75rem', 
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: 'var(--warning)'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 'bold' }}>
                <AlertTriangle size={16} /> Mode Demo Aktif
              </div>
              <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                Kredensial Supabase belum diatur di file <code>.env</code>. Anda dapat menguji interface ini secara bebas.
              </p>
            </div>
          )}

          <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
            {isRegister ? 'Buat Akun Baru' : 'Masuk ke Aplikasi'}
          </h3>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {isRegister ? 'Daftar sebagai tenant baru dan mulai lacak keuangan.' : 'Akses dashboard finansial pribadi terisolasi Anda.'}
          </p>

          {authError && (
            <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {authSuccess}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Alamat Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="nama@perusahaan.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={authLoading}>
              {authLoading ? 'Memproses...' : isRegister ? 'Mulai Registrasi' : 'Masuk Sekarang'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akun tenant?'}
            </span>{' '}
            <button 
              onClick={() => {
                setIsRegister(!isRegister)
                setAuthError('')
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegister ? 'Masuk' : 'Daftar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // JIKA SUDAH LOGIN
  return (
    <div className="app-container">
      {/* Sidebar Kiri */}
      <aside style={{ 
        width: '280px', 
        background: 'var(--bg-card)', 
        borderRight: '1px solid var(--border)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%' }}>
              <Coins size={24} style={{ color: 'var(--primary)', display: 'block' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>FinancerSaaS</h2>
              <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', marginTop: '-4px' }}>Tenant: {profile?.full_name || user.email}</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <a href="#" className="btn btn-secondary" style={{ justifyContent: 'flex-start', background: 'var(--primary-light)', border: 'none', color: 'var(--primary)' }}>
              <Wallet size={18} /> Dashboard Utama
            </a>
          </nav>
        </div>

        {/* User Info / Logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--border)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContext: 'center', color: 'var(--text-main)' }}>
              <UserIcon size={18} style={{ margin: 'auto' }} />
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
          <button onClick={signOut} className="btn btn-secondary btn-full" style={{ color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
            <LogOut size={16} /> Keluar Sesi
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Dashboard Finansial</h1>
            <p>Selamat datang kembali! Lacak dan kelola anggaran bulanan Anda di sini.</p>
          </div>
          
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <PlusCircle size={18} /> Catat Transaksi
          </button>
        </header>

        {isSupabasePlaceholder && (
          <div style={{ 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.2)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1rem', 
            marginBottom: '2rem',
            color: 'var(--text-main)'
          }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              <AlertTriangle size={18} /> Anda Berada dalam Mode Demo Lokal
            </h4>
            <p style={{ fontSize: '0.9rem' }}>
              Aplikasi berjalan dengan mock data karena Supabase belum dikonfigurasi secara langsung.
              Ubah kredensial di file <code>.env</code> untuk mengaktifkan sinkronisasi database relasional Supabase yang terisolasi dengan RLS.
            </p>
          </div>
        )}

        {/* Ringkasan Anggaran (Batas Anggaran) */}
        <section className="card card-premium" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batas Pengeluaran Bulanan (Limit Tracker)</span>
              {editingBudget ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Rp</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ width: '150px', padding: '0.25rem 0.5rem' }} 
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                  />
                  <button onClick={handleUpdateBudget} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>Simpan</button>
                  <button onClick={() => setEditingBudget(false)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>Batal</button>
                </div>
              ) : (
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  Rp {actualBudget.toLocaleString('id-ID')}
                  <button 
                    onClick={() => { setTempBudget(actualBudget.toString()); setEditingBudget(true); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Ubah
                  </button>
                </h2>
              )}
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Terpakai</span>
              <h3 style={{ fontSize: '1.25rem', color: totalExpense > actualBudget ? 'var(--danger)' : 'var(--text-main)', marginTop: '0.25rem' }}>
                Rp {totalExpense.toLocaleString('id-ID')} ({budgetPercentage}%)
              </h3>
            </div>
          </div>

          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${budgetPercentage}%`, 
                backgroundColor: getProgressBarColor(budgetPercentage) 
              }}
            ></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            <span>Sisa Anggaran: <strong style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>Rp {(actualBudget - totalExpense).toLocaleString('id-ID')}</strong></span>
            {budgetPercentage >= 90 && (
              <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                <AlertTriangle size={14} /> Peringatan: Anggaran hampir habis!
              </span>
            )}
          </div>
        </section>

        {/* 3 Grid Keuangan */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Pemasukan Bulan Ini</span>
              <div style={{ background: 'var(--success-light)', padding: '0.35rem', borderRadius: '50%' }}>
                <TrendingUp size={20} style={{ color: 'var(--success)', display: 'block' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>Rp {totalIncome.toLocaleString('id-ID')}</h2>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Berdasarkan seluruh transaksi masuk</p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Pengeluaran Bulan Ini</span>
              <div style={{ background: 'var(--danger-light)', padding: '0.35rem', borderRadius: '50%' }}>
                <TrendingDown size={20} style={{ color: 'var(--danger)', display: 'block' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>Rp {totalExpense.toLocaleString('id-ID')}</h2>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Berdasarkan seluruh pengeluaran terdaftar</p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Arus Kas Bersih (Sisa)</span>
              <div style={{ background: balance >= 0 ? 'var(--success-light)' : 'var(--danger-light)', padding: '0.35rem', borderRadius: '50%' }}>
                <Wallet size={20} style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)', display: 'block' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              Rp {balance.toLocaleString('id-ID')}
            </h2>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Pemasukan dikurangi Pengeluaran</p>
          </div>
        </section>

        {/* Form Modal Pencatatan Transaksi Baru */}
        {showAddForm && (
          <div style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 100,
            backdropFilter: 'blur(4px)'
          }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Tambah Transaksi Baru</h3>
              <form onSubmit={handleAddTransaction}>
                <div className="form-group">
                  <label className="form-label">Tipe Transaksi</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setTxType('expense')} 
                      className={`btn btn-secondary ${txType === 'expense' ? 'btn-danger' : ''}`}
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      Pengeluaran
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setTxType('income')} 
                      className={`btn btn-secondary ${txType === 'income' ? 'btn-primary' : ''}`}
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      Pemasukan
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jumlah (Rupiah)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="100000" 
                    required 
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select 
                    className="form-input" 
                    value={txCategory} 
                    onChange={(e) => setTxCategory(e.target.value)}
                  >
                    {MOCK_CATEGORIES.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Transaksi</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi Opsional</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Contoh: Belanja mingguan" 
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan Transaksi</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabel Transaksi Terakhir */}
        <section className="card">
          <h3 style={{ marginBottom: '1rem' }}>Mutasi Transaksi Terakhir (Isolated Tenant View)</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Tipe</th>
                  <th style={{ textAlign: 'right' }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.transaction_date}</td>
                    <td>
                      <span style={{ 
                        background: 'var(--border)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        {t.category}
                      </span>
                    </td>
                    <td>{t.description || '-'}</td>
                    <td>
                      <span style={{ 
                        color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', 
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase'
                      }}>
                        {t.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      color: t.type === 'income' ? 'var(--success)' : 'var(--text-main)' 
                    }}>
                      {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
