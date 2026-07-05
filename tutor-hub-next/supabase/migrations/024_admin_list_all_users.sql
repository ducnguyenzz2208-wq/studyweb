-- ============================================================
-- MIGRATION 024: Admin thấy MỌI tài khoản (kể cả chưa có profile)
-- VẤN ĐỀ: mục "Quản lý người dùng" đọc bảng profiles. Tài khoản mới mà trigger
-- tạo profile bị lỗi (lỗi 500 khi đăng ký) → có trong auth.users nhưng KHÔNG có
-- profile → admin không thấy, không duyệt được.
-- SỬA: 2 RPC SECURITY DEFINER (admin-only):
--   - admin_list_users(): auth.users LEFT JOIN profiles → thấy cả user chưa có profile
--     (vai trò hiện 'Pending').
--   - admin_set_role(): đổi vai trò + TẠO profile nếu chưa có (duyệt là có profile).
-- Run in: Supabase SQL Editor (sau 001 đã có my_role(); nên chạy cùng/đằng sau 023).
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id UUID, email TEXT, name TEXT, role TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.my_role() <> 'Admin' THEN RETURN; END IF; -- không phải admin → rỗng
  RETURN QUERY
    SELECT u.id,
           u.email::TEXT,
           COALESCE(p.name, split_part(u.email, '@', 1))::TEXT AS name,
           COALESCE(p.role, 'Pending')::TEXT AS role,
           u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY u.created_at DESC;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Đổi vai trò cho 1 user; TẠO profile nếu chưa có (tài khoản chờ duyệt lỡ thiếu profile).
-- Trả về: 'ok' | 'not_admin' | 'no_user' | 'bad_role'
CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id UUID, _role TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email TEXT;
BEGIN
  IF public.my_role() <> 'Admin' THEN RETURN 'not_admin'; END IF;
  IF _role NOT IN ('Admin','Teacher','Parent','Student','Pending') THEN RETURN 'bad_role'; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  IF _email IS NULL THEN RETURN 'no_user'; END IF;
  INSERT INTO public.profiles (id, email, name, role, language)
    VALUES (_user_id, _email, split_part(_email, '@', 1), _role, 'en')
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  RETURN 'ok';
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_role(UUID, TEXT) TO authenticated;
