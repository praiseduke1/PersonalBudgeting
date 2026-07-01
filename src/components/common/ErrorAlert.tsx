import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorAlertProps {
  message: string
  onRetry?: () => void
}

export default function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div style={{
      background: 'var(--danger-light)',
      border: '1px solid var(--danger)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', flexShrink: 0 }}>
          <RefreshCw size={14} /> Coba Lagi
        </button>
      )}
    </div>
  )
}
