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

export interface RecurringTransaction {
  id: string
  user_id: string
  category_id: string
  amount: number
  type: 'income' | 'expense'
  description: string | null
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface FinancialGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string
  color: string
  is_completed: boolean
  created_at: string
}
