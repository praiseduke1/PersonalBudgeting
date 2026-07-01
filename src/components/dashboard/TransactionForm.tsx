import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { Category, Transaction, Account } from '../../types'

interface TransactionFormProps {
  userId: string
  categories: Category[]
  editTransaction?: Transaction | null
  onSaved: () => void
  onClose: () => void
}

export default function TransactionForm({ userId, categories, editTransaction, onSaved, onClose }: TransactionFormProps) {
  const [type, setType] = React.useState<'income' | 'expense'>(editTransaction?.type || 'expense')
  const [amount, setAmount] = React.useState(editTransaction?.amount.toString() || '')
  const [category, setCategory] = React.useState(editTransaction?.category_id || '')
  const [date, setDate] = React.useState(
    editTransaction?.transaction_date
      ? new Date(editTransaction.transaction_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [desc, setDesc] = React.useState(editTransaction?.description || '')
  const [error, setError] = React.useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = React.useState('')

  useEffect(() => {
    supabase.from('accounts').select('*').eq('user_id', userId).eq('is_active', true).then(({ data }) => {
      if (data) setAccounts(data as Account[])
    })
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || !category) return

    const payload: any = {
      category_id: category,
      amount: Number(amount),
      transaction_date: date,
      description: desc || null,
      account_id: accountId || null
    }

    let saveError
    if (editTransaction) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editTransaction.id)
      saveError = error
    } else {
      const { error } = await supabase.from('transactions').insert({ ...payload, user_id: userId })
      saveError = error
    }

    if (saveError) {
      setError(saveError.message)
      toast.error(saveError.message)
      return
    }

    // Update balance jika terhubung ke akun
    if (accountId) {
      const balanceChange = type === 'income' ? Number(amount) : -Number(amount)
      await supabase.rpc('update_account_balance', { p_account_id: accountId, p_amount: balanceChange })
    }

    toast.success(editTransaction ? 'Transaksi diperbarui' : 'Transaksi ditambahkan')
    onSaved()
  }

  const filteredCategories = categories.filter(c => c.type === type)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>{editTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h3>

        {error && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tipe Transaksi</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => { setType('expense'); setCategory(''); }}
                className={`btn btn-secondary ${type === 'expense' ? 'btn-danger' : ''}`}
                style={{ flex: 1, padding: '0.5rem' }}>
                Pengeluaran
              </button>
              <button type="button" onClick={() => { setType('income'); setCategory(''); }}
                className={`btn btn-secondary ${type === 'income' ? 'btn-primary' : ''}`}
                style={{ flex: 1, padding: '0.5rem' }}>
                Pemasukan
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Jumlah (Rupiah)</label>
            <input type="number" className="form-input" placeholder="100000" required
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="form-input" value={category}
              onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Pilih kategori</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Akun (opsional)</label>
            <select className="form-input" value={accountId}
              onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Tanpa akun</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal Transaksi</label>
            <input type="date" className="form-input" required
              value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Opsional</label>
            <input type="text" className="form-input" placeholder="Contoh: Belanja mingguan"
              value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}</button>
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
          </div>
        </form>
      </div>
    </div>
  )
}
