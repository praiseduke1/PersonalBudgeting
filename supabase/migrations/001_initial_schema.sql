-- ============================================================
-- FinancerSaaS - Skema Database Multi-Tenant
-- ============================================================

-- 1. TABEL PROFILES (Tenant Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  monthly_budget NUMERIC(15,2) DEFAULT 2500000.00 CHECK (monthly_budget >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. TABEL CATEGORIES (Kategori Kustom Per Tenant)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. TABEL TRANSACTIONS (Mutasi Finansial Tenant)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  description TEXT NULL
);

-- 4. TRIGGER: Auto-create profile + default categories saat user daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, monthly_budget)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Tenant Baru'),
    2500000.00
  );

  INSERT INTO public.categories (user_id, name, type) VALUES
    (new.id, 'Makanan', 'expense'),
    (new.id, 'Transportasi', 'expense'),
    (new.id, 'Belanja', 'expense'),
    (new.id, 'Gaji', 'income'),
    (new.id, 'Investasi', 'income');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Tenants can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Tenants can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Tenants can view their own categories"
  ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own categories"
  ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own categories"
  ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own categories"
  ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Tenants can view their own transactions"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own transactions"
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own transactions"
  ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own transactions"
  ON public.transactions FOR DELETE USING (auth.uid() = user_id);
