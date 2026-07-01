import { supabase } from '../lib/supabaseClient'
import { Transaction, Category } from '../types'
import { getMonthBounds } from './format'

export async function fetchTransactions(
  userId: string,
  selectedMonth: string,
  page: number,
  pageSize: number
) {
  const { startDate, endDate } = getMonthBounds(selectedMonth)
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name, type)')
    .eq('user_id', userId)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDate)
    .order('transaction_date', { ascending: false })
    .range(from, to)

  if (error) throw error

  const mapped: Transaction[] = (data || []).map(t => ({
    id: t.id,
    type: (t.categories as any)?.type || 'expense',
    amount: Number(t.amount),
    category: (t.categories as any)?.name || 'Unknown',
    category_id: t.category_id,
    transaction_date: t.transaction_date,
    description: t.description
  }))

  return { transactions: mapped, hasMore: (data?.length || 0) === pageSize }
}

export async function fetchCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return (data || []) as Category[]
}

export async function fetchTransactionTrend(userId: string, monthsBack = 5) {
  const months: { month: string; income: number; expense: number }[] = []
  const now = new Date()

  for (let i = monthsBack; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startDate = d.toISOString().slice(0, 10)
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10)

    const { data: txData, error } = await supabase
      .from('transactions')
      .select('*, categories(type)')
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lt('transaction_date', endDate)

    if (error) throw error

    let income = 0, expense = 0
    txData?.forEach(t => {
      if ((t.categories as any)?.type === 'income') income += Number(t.amount)
      else expense += Number(t.amount)
    })

    months.push({ month: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()], income, expense })
  }

  return months
}

export async function exportTransactionsCSV(userId: string, selectedMonth: string) {
  const { startDate, endDate } = getMonthBounds(selectedMonth)

  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name, type)')
    .eq('user_id', userId)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDate)
    .order('transaction_date', { ascending: false })

  if (error) throw error

  return (data || []).map((t: any) => ({
    Tanggal: new Date(t.transaction_date).toLocaleDateString('id-ID'),
    Tipe: (t.categories as any)?.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    Kategori: (t.categories as any)?.name || 'Unknown',
    Deskripsi: t.description || '',
    Jumlah: Number(t.amount)
  }))
}
