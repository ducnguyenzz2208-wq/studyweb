-- ============================================================
-- MIGRATION 007: Tra cứu tài khoản theo email (cho Add Student)
-- find_account(email) -> trả về user_id, email, name, role
-- Chỉ Teacher/Admin được tra cứu. SECURITY DEFINER để đọc auth.users.
-- Run in: Supabase SQL Editor (sau 001-006)
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_account(_email TEXT)
RETURNS TABLE (user_id UUID, email TEXT, name TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.my_role() NOT IN ('Teacher','Admin') THEN
    RETURN; -- không có quyền -> rỗng
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::TEXT,
           COALESCE(p.name, split_part(u.email, '@', 1))::TEXT,
           COALESCE(p.role, '')::TEXT
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.email = lower(trim(_email))
    LIMIT 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.find_account(TEXT) TO authenticated;
