-- ============================================================
-- FinancerSaaS - Fitur Finance Lengkap
-- ============================================================

-- 1. AKUN / REKENING
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'savings', 'other')),
  balance NUMERIC(15,2) DEFAULT 0 NOT NULL,
  icon TEXT DEFAULT 'wallet' NOT NULL,
  color TEXT DEFAULT '#6366f1' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tambah kolom account_id ke transaksi yang sudah ada
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 2. TRANSFER ANTAR AKUN
CREATE TABLE IF NOT EXISTS public.account_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NULL,
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. ANGGARAN PER KATEGORI
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, category_id, month)
);

-- 4. INVESTASI
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stock', 'mutual_fund', 'crypto', 'gold', 'property', 'deposit', 'other')),
  amount_invested NUMERIC(15,2) NOT NULL CHECK (amount_invested >= 0),
  current_value NUMERIC(15,2) NOT NULL CHECK (current_value >= 0),
  purchase_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. UTANG / PIUTANG
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debt', 'receivable')),
  total_amount NUMERIC(15,2) NOT NULL CHECK (total_amount > 0),
  remaining_amount NUMERIC(15,2) NOT NULL CHECK (remaining_amount >= 0),
  interest_rate NUMERIC(5,2) DEFAULT 0 NOT NULL CHECK (interest_rate >= 0),
  due_date DATE NULL,
  notes TEXT NULL,
  is_settled BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. RIWAYAT NET WORTH
CREATE TABLE IF NOT EXISTS public.net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_assets NUMERIC(15,2) NOT NULL,
  total_liabilities NUMERIC(15,2) NOT NULL,
  net_worth NUMERIC(15,2) NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, recorded_at)
);

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Tenants can view their own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Transfers policies
CREATE POLICY "Tenants can view their own transfers" ON public.account_transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own transfers" ON public.account_transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own transfers" ON public.account_transfers FOR DELETE USING (auth.uid() = user_id);

-- Budget categories policies
CREATE POLICY "Tenants can view their own budget categories" ON public.budget_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own budget categories" ON public.budget_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own budget categories" ON public.budget_categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own budget categories" ON public.budget_categories FOR DELETE USING (auth.uid() = user_id);

-- Investments policies
CREATE POLICY "Tenants can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- Debts policies
CREATE POLICY "Tenants can view their own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- Net worth history policies
CREATE POLICY "Tenants can view their own net worth" ON public.net_worth_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own net worth" ON public.net_worth_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own net worth" ON public.net_worth_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
