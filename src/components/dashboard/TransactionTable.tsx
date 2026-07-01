import { Pencil, Trash2, ChevronDown, Loader2 } from 'lucide-react'
import { Transaction } from '../../types'

interface TransactionTableProps {
  transactions: Transaction[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
}

export default function TransactionTable({
  transactions, hasMore, loadingMore, onLoadMore, onEdit, onDelete
}: TransactionTableProps) {
  return (
    <section className="card">
      <h3 style={{ marginBottom: '1rem' }}>Mutasi Transaksi</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Tipe</th>
              <th style={{ textAlign: 'right' }}>Jumlah</th>
              <th style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
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
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button onClick={() => onEdit(t)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}
                        title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => onDelete(t.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}
                        title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="btn btn-secondary"
            style={{ minWidth: '160px', justifyContent: 'center' }}
          >
            {loadingMore ? (
              <><Loader2 size={16} className="pulse" /> Memuat...</>
            ) : (
              <><ChevronDown size={16} /> Muat Lainnya</>
            )}
          </button>
        </div>
      )}

      {!hasMore && transactions.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Semua transaksi telah dimuat ({transactions.length})
        </p>
      )}
    </section>
  )
}
