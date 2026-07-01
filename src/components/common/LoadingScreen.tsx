import { RefreshCw } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="auth-layout">
      <div className="card text-center" style={{ padding: '3rem' }}>
        <RefreshCw className="pulse" size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <p>Memuat profil tenant dan konfigurasi sesi...</p>
      </div>
    </div>
  )
}
