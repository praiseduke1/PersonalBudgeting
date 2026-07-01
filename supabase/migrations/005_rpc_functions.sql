-- ============================================================
-- FinancerSaaS - RPC Functions untuk akun balance
-- ============================================================

-- Update saldo akun (positif = masuk, negatif = keluar)
CREATE OR REPLACE FUNCTION public.update_account_balance(
  p_account_id UUID,
  p_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.accounts
  SET balance = balance + p_amount
  WHERE id = p_account_id
    AND user_id = auth.uid();
END;
$$;

-- Transfer antar akun (atomik)
CREATE OR REPLACE FUNCTION public.transfer_between_accounts(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Kurang saldo akun asal
  UPDATE public.accounts
  SET balance = balance - p_amount
  WHERE id = p_from_account_id
    AND user_id = p_user_id
    AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saldo akun asal tidak mencukupi';
  END IF;

  -- Tambah saldo akun tujuan
  UPDATE public.accounts
  SET balance = balance + p_amount
  WHERE id = p_to_account_id
    AND user_id = p_user_id;

  -- Catat transfer
  INSERT INTO public.account_transfers (
    user_id, from_account_id, to_account_id,
    amount, description, transfer_date
  ) VALUES (
    p_user_id, p_from_account_id, p_to_account_id,
    p_amount, p_description, p_transfer_date
  );
END;
$$;
