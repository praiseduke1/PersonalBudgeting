import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-layout">
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '3rem' }}>
            <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Terjadi Kesalahan</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {this.state.error?.message || 'Aplikasi mengalami error yang tidak terduga.'}
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              <RefreshCw size={16} /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
