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

export interface Account {
  id: string
  user_id: string
  name: string
  type: 'cash' | 'bank' | 'ewallet' | 'savings' | 'other'
  balance: number
  icon: string
  color: string
  is_active: boolean
  created_at: string
}

export interface AccountTransfer {
  id: string
  user_id: string
  from_account_id: string
  to_account_id: string
  amount: number
  description: string | null
  transfer_date: string
  created_at: string
}

export interface BudgetCategory {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: string
  created_at: string
}

export interface Investment {
  id: string
  user_id: string
  name: string
  type: 'stock' | 'mutual_fund' | 'crypto' | 'gold' | 'property' | 'deposit' | 'other'
  amount_invested: number
  current_value: number
  purchase_date: string | null
  notes: string | null
  created_at: string
}

export interface Debt {
  id: string
  user_id: string
  name: string
  type: 'debt' | 'receivable'
  total_amount: number
  remaining_amount: number
  interest_rate: number
  due_date: string | null
  notes: string | null
  is_settled: boolean
  created_at: string
}

export interface NetWorthEntry {
  id: string
  user_id: string
  total_assets: number
  total_liabilities: number
  net_worth: number
  recorded_at: string
  created_at: string
}
