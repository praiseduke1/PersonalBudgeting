import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { Category } from '../../types'
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'

interface CategoryManagerProps {
  categories: Category[]
  userId: string
  onRefresh: () => void
  onClose: () => void
}

export default function CategoryManager({ categories, userId, onRefresh, onClose }: CategoryManagerProps) {
  const [editId, setEditId] = useState<string | null>(null)
  const [addType, setAddType] = useState<'income' | 'expense' | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const resetForm = () => {
    setEditId(null)
    setAddType(null)
    setName('')
  }

  const startAdd = (t: 'income' | 'expense') => {
    resetForm()
    setAddType(t)
  }

  const startEdit = (c: Category) => {
    setAddType(null)
    setEditId(c.id)
    setName(c.name)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    if (editId) {
      const { error } = await supabase.from('categories').update({ name: name.trim() }).eq('id', editId)
      if (error) { toast.error('Gagal mengupdate: ' + error.message); setSaving(false); return }
      toast.success('Kategori diperbarui')
    } else {
      const { error } = await supabase.from('categories').insert({ name: name.trim(), type: addType, user_id: userId })
      if (error) { toast.error('Gagal menambah: ' + error.message); setSaving(false); return }
      toast.success('Kategori ditambahkan')
    }

    setSaving(false)
    resetForm()
    onRefresh()
  }

  const handleDelete = async (id: string, catName: string) => {
    setDeleting(id)

    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      const ok = confirm(`Kategori "${catName}" digunakan oleh ${count} transaksi. Tetap hapus?`)
      if (!ok) { setDeleting(null); return }
    } else {
      const ok = confirm(`Hapus kategori "${catName}"?`)
      if (!ok) { setDeleting(null); return }
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { toast.error('Gagal menghapus: ' + error.message); setDeleting(null); return }
    toast.success('Kategori dihapus')
    setDeleting(null)
    onRefresh()
  }

  const renderAddForm = (t: 'income' | 'expense') => (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      <input
        className="form-input"
        style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
        placeholder="Nama kategori"
        value={addType === t ? name : ''}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') resetForm() }}
      />
      <button onClick={handleSave} disabled={saving || !name.trim()}
        className="btn btn-primary"
        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', lineHeight: 0 }}>
        {saving ? <Loader2 size={14} className="pulse" /> : <Check size={14} />}
      </button>
      <button onClick={resetForm}
        className="btn btn-secondary"
        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', lineHeight: 0 }}>
        <X size={14} />
      </button>
    </div>
  )

  const renderList = (items: Category[], type: 'income' | 'expense') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {items.length === 0 && addType !== type && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
          Belum ada kategori.
        </p>
      )}
      {items.map(c => (
        <div key={c.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', gap: '0.5rem'
        }}>
          {editId === c.id ? (
            <>
              <input
                className="form-input"
                style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') resetForm() }}
              />
              <button onClick={handleSave} disabled={saving || !name.trim()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '0.25rem', lineHeight: 0 }}>
                {saving ? <Loader2 size={16} className="pulse" /> : <Check size={16} />}
              </button>
              <button onClick={resetForm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', lineHeight: 0 }}>
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>{c.name}</span>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button onClick={() => startEdit(c)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem', lineHeight: 0 }}
                  title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} disabled={deleting === c.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem', lineHeight: 0 }}
                  title="Hapus">
                  {deleting === c.id ? <Loader2 size={14} className="pulse" /> : <Trash2 size={14} />}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      {addType === type && renderAddForm(type)}
    </div>
  )

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{
        maxWidth: '520px', width: '100%', padding: '2rem',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Manajemen Kategori</h3>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--danger)' }}>Pengeluaran</h4>
              {addType !== 'expense' && (
                <button onClick={() => startAdd('expense')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}>
                  <Plus size={14} /> Tambah
                </button>
              )}
            </div>
            {renderList(expenseCategories, 'expense')}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--success)' }}>Pemasukan</h4>
              {addType !== 'income' && (
                <button onClick={() => startAdd('income')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}>
                  <Plus size={14} /> Tambah
                </button>
              )}
            </div>
            {renderList(incomeCategories, 'income')}
          </div>
        </div>
      </div>
    </div>
  )
}
