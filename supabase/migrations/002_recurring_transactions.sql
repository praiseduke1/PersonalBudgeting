-- ============================================================
-- FinancerSaaS - Skema Transaksi Berulang (Recurring)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own recurring"
  ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenants can insert their own recurring"
  ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenants can update their own recurring"
  ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenants can delete their own recurring"
  ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);
