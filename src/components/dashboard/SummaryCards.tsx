import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  balance: number
}

export default function SummaryCards({ totalIncome, totalExpense, balance }: SummaryCardsProps) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Pemasukan Bulan Ini</span>
          <div style={{ background: 'var(--success-light)', padding: '0.35rem', borderRadius: '50%' }}>
            <TrendingUp size={20} style={{ color: 'var(--success)', display: 'block' }} />
          </div>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
          Rp {totalIncome.toLocaleString('id-ID')}
        </h2>
        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Berdasarkan seluruh transaksi masuk</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Pengeluaran Bulan Ini</span>
          <div style={{ background: 'var(--danger-light)', padding: '0.35rem', borderRadius: '50%' }}>
            <TrendingDown size={20} style={{ color: 'var(--danger)', display: 'block' }} />
          </div>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
          Rp {totalExpense.toLocaleString('id-ID')}
        </h2>
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
  )
}
