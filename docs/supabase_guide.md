# Panduan Integrasi Supabase: SaaS Personal Budgeting

Dokumen ini menjelaskan langkah demi langkah untuk menghubungkan frontend React (Vite) dengan Supabase Client, menginisialisasi database relasional, menerapkan Row Level Security (RLS) untuk isolasi multi-tenant, dan membuat trigger otomatis.

---

## Langkah 1: Setup Proyek Lokal & Dependensi

1. Buka PowerShell atau Command Prompt Anda di direktori proyek `D:\Personal Budgeting`.
2. Jalankan skrip inisialisasi yang telah disediakan:
   ```powershell
   .\init-project.ps1
   ```
   *Skrip ini akan memeriksa Node.js, membuat struktur folder, mengunduh dependensi (termasuk `@supabase/supabase-js` dan `lucide-react`), serta menyiapkan file `.env`.*

---

## Langkah 2: Menghubungkan React dengan Supabase Client

1. Dapatkan kredensial API Supabase Anda dari dashboard online Supabase:
   - Masuk ke dashboard Supabase (https://supabase.com).
   - Pilih proyek Anda -> Masuk ke menu **Project Settings** (ikon gerigi) -> **API**.
   - Salin **Project URL** dan **anon public** key.
2. Buka file `.env` di root folder proyek Anda.
3. Tempel kredensial yang telah disalin ke variabel berikut:
   ```env
   VITE_SUPABASE_URL=https://[id-proyek-anda].supabase.co
   VITE_SUPABASE_ANON_KEY=[kunci-anon-anda]
   ```
4. Hubungkan client di React menggunakan file [supabaseClient.ts](file:///D:/Personal%20Budgeting/src/lib/supabaseClient.ts) dan gunakan state global dari [AuthContext.tsx](file:///D:/Personal%20Budgeting/src/context/AuthContext.tsx) untuk memonitor sesi pengguna secara aman:
   ```typescript
   import { useAuth } from './context/AuthContext'
   const { user, profile, signOut } = useAuth()
   ```

---

## Langkah 3: Inisialisasi Database Relasional & Skema Tabel

Jalankan perintah SQL berikut di **SQL Editor** pada Dashboard Supabase Anda untuk membuat tabel sesuai PRD:

### 1. Tabel `profiles` (Tenant Profiles)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  monthly_budget NUMERIC(15,2) DEFAULT 2500000.00 CHECK (monthly_budget >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 2. Tabel `categories` (Kategori Finansial Kustom Per Tenant)
```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 3. Tabel `transactions` (Mutasi Finansial Tenant)
```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  description TEXT NULL
);
```

---

## Langkah 4: Otomatisasi Pembuatan Profil (Automatic Onboarding Trigger)

Sesuai dengan PRD bagian *Pendaftaran Akun (Tenant Onboarding)*, sistem harus membuat entitas profil baru secara otomatis ketika tenant melakukan registrasi melalui Supabase Auth. 

Jalankan skrip berikut di **SQL Editor** untuk membuat trigger database:

```sql
-- 1. Buat fungsi handler trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, monthly_budget)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Tenant Baru'),
    2500000.00 -- Default anggaran bulanan Rp 2.500.000
  );
  
  -- Masukkan kategori bawaan default untuk user baru
  INSERT INTO public.categories (user_id, name, type) VALUES
    (new.id, 'Makanan', 'expense'),
    (new.id, 'Transportasi', 'expense'),
    (new.id, 'Belanja', 'expense'),
    (new.id, 'Gaji', 'income'),
    (new.id, 'Investasi', 'income');
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tautkan fungsi trigger ke event INSERT di tabel auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Langkah 5: Keamanan & Kebijakan Row Level Security (RLS)

Untuk menjamin pemisahan data (data isolation) mutlak antar tenant:

1. **Aktifkan RLS** pada seluruh tabel operasional:
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
   ```

2. **Buat Kebijakan Keamanan (Policies) untuk tabel `transactions`**:
   ```sql
   -- Kebijakan SELECT (Membaca data sendiri)
   CREATE POLICY "Tenants can view their own transactions" 
   ON public.transactions FOR SELECT 
   USING (auth.uid() = user_id);

   -- Kebijakan INSERT (Menambah data sendiri)
   CREATE POLICY "Tenants can insert their own transactions" 
   ON public.transactions FOR INSERT 
   WITH CHECK (auth.uid() = user_id);

   -- Kebijakan UPDATE (Memperbarui data sendiri)
   CREATE POLICY "Tenants can update their own transactions" 
   ON public.transactions FOR UPDATE 
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);

   -- Kebijakan DELETE (Menghapus data sendiri)
   CREATE POLICY "Tenants can delete their own transactions" 
   ON public.transactions FOR DELETE 
   USING (auth.uid() = user_id);
   ```

3. **Buat Kebijakan Keamanan untuk tabel `profiles` dan `categories`**:
   ```sql
   -- Kebijakan untuk Profiles
   CREATE POLICY "Tenants can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Tenants can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

   -- Kebijakan untuk Categories
   CREATE POLICY "Tenants can view their own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Tenants can insert their own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Tenants can update their own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Tenants can delete their own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);
   ```

---

## Langkah 6: Pengembangan Menggunakan Supabase CLI (Opsional)

Jika Anda ingin melakukan pengembangan database secara lokal menggunakan docker:
1. Instal Supabase CLI:
   - Windows (via Scoop): `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
   - Windows (via NPM): `npm install -g supabase`
2. Jalankan inisialisasi lokal di folder proyek:
   ```bash
   supabase init
   ```
3. Mulai server Supabase lokal (membutuhkan Docker Desktop berjalan):
   ```bash
   supabase start
   ```
