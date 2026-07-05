-- ============================================================
-- MIGRATION 018: Tra cứu tài khoản theo TÊN (cho Add Student)
-- find_account_by_name(_q) -> trả về user_id, email, name, role
-- Khớp theo name HOẶC email (ILIKE), tối đa 5 kết quả, ưu tiên khớp đầu tên.
-- Chỉ Teacher/Admin. SECURITY DEFINER để đọc auth.users. Chạy sau 007.
-- Run in: Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_account_by_name(_q TEXT)
RETURNS TABLE (user_id UUID, email TEXT, name TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q TEXT := trim(_q);
BEGIN
  IF public.my_role() NOT IN ('Teacher','Admin') THEN
    RETURN; -- không có quyền -> rỗng
  END IF;
  IF q = '' THEN RETURN; END IF;
  RETURN QUERY
    SELECT u.id, u.email::TEXT,
           COALESCE(p.name, split_part(u.email, '@', 1))::TEXT AS nm,
           COALESCE(p.role, '')::TEXT
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE COALESCE(p.name, '') ILIKE '%' || q || '%'
       OR u.email ILIKE '%' || q || '%'
    ORDER BY
      (lower(COALESCE(p.name, '')) LIKE lower(q) || '%') DESC,  -- khớp đầu tên trước
      nm ASC
    LIMIT 5;
END; $$;

GRANT EXECUTE ON FUNCTION public.find_account_by_name(TEXT) TO authenticated;
