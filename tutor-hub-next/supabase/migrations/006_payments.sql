-- ============================================================
-- MIGRATION 006: Payments + phân quyền
-- - payments: khoản thu học phí gắn với 1 tài khoản
-- - Admin quản lý tất cả; mỗi user chỉ xem khoản của MÌNH
-- - create_payment(): admin tạo khoản thu theo email học sinh
-- Run in: Supabase SQL Editor (sau 001-005)
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- người phải đóng
  student_name TEXT,
  amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date     DATE,
  paid_date    DATE,
  status       TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid','Pending','Overdue')),
  note         TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages payments" ON payments;
DROP POLICY IF EXISTS "User reads own payments"  ON payments;

-- Admin: toàn quyền
CREATE POLICY "Admin manages payments" ON payments FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');

-- Mỗi user: chỉ ĐỌC khoản của chính mình (không thấy của người khác)
CREATE POLICY "User reads own payments" ON payments FOR SELECT
  USING (user_id = auth.uid());

-- ── RPC: admin tạo khoản thu theo email ─────────────────────
-- 'ok' | 'not_admin' | 'no_user'
CREATE OR REPLACE FUNCTION public.create_payment(_email TEXT, _amount NUMERIC, _due DATE, _status TEXT, _note TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID; _name TEXT;
BEGIN
  IF public.my_role() <> 'Admin' THEN RETURN 'not_admin'; END IF;
  SELECT id INTO _uid FROM auth.users WHERE email = lower(trim(_email)) LIMIT 1;
  IF _uid IS NULL THEN RETURN 'no_user'; END IF;
  SELECT name INTO _name FROM profiles WHERE id = _uid;
  INSERT INTO payments (user_id, student_name, amount, due_date, status, note, created_by)
    VALUES (_uid, COALESCE(_name, _email), COALESCE(_amount,0), _due,
            COALESCE(NULLIF(_status,''),'Pending'), _note, auth.uid());
  RETURN 'ok';
END; $$;
GRANT EXECUTE ON FUNCTION public.create_payment(TEXT, NUMERIC, DATE, TEXT, TEXT) TO authenticated;
