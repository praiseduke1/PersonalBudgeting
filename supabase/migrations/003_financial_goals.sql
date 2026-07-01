-- ============================================================
-- FinancerSaaS - Skema Target Finansial (Goals)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15,2) DEFAULT 0 NOT NULL CHECK (current_amount >= 0),
  deadline DATE NULL,
  icon TEXT DEFAULT 'target' NOT NULL,
  color TEXT DEFAULT '#6366f1' NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own goals"
  ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenants can insert their own goals"
  ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenants can update their own goals"
  ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenants can delete their own goals"
  ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);
