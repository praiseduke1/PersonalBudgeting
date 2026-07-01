export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  category_id: string
  transaction_date: string
  description: string | null
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}
