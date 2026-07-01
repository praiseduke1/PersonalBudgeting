import { Transaction } from '../../types'

interface TransactionTableProps {
  transactions: Transaction[]
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  return (
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
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Belum ada transaksi. Klik "Catat Transaksi" untuk memulai.
                </td>
              </tr>
            ) : (
              transactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
                  <td>
                    <span style={{
                      background: 'var(--border)', padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500
                    }}>
                      {t.category}
                    </span>
                  </td>
                  <td>{t.description || '-'}</td>
                  <td>
                    <span style={{
                      color: t.type === 'income' ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'
                    }}>
                      {t.type === 'income' ? 'Masuk' : 'Keluar'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--text-main)' }}>
                    {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
