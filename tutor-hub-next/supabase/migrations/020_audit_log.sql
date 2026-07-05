-- ============================================================
-- MIGRATION 020: Nhật ký hoạt động của admin (audit log)
-- Bảng ghi lại các thao tác nhạy cảm (đổi vai trò, phân lớp, tạo/đánh dấu
-- học phí, nạp/xoá dữ liệu mẫu…). Chỉ Admin đọc được. Ghi qua hàm
-- SECURITY DEFINER log_audit() để actor_id luôn = auth.uid() (không giả mạo).
-- Run in: Supabase SQL Editor. Chạy sau 013 (đã có public.my_role()).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name  TEXT,
  actor_role  TEXT,
  action      TEXT NOT NULL,           -- vd: 'role_change', 'assign_class'
  entity      TEXT,                    -- đối tượng bị tác động, vd 'user', 'payment'
  detail      TEXT,                    -- mô tả người-đọc-được
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Chỉ Admin đọc nhật ký. Không cho client INSERT/UPDATE/DELETE trực tiếp —
-- mọi ghi log đi qua hàm SECURITY DEFINER bên dưới.
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT
  USING (public.my_role() = 'Admin');

-- Ghi một dòng nhật ký. Chỉ Teacher/Admin được ghi (đủ cho các thao tác quản trị).
-- actor_id/actor_name/actor_role lấy từ phiên hiện tại → không thể mạo danh.
CREATE OR REPLACE FUNCTION public.log_audit(_action TEXT, _entity TEXT, _detail TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role TEXT := public.my_role();
  _name TEXT;
BEGIN
  IF _role NOT IN ('Teacher','Admin') THEN
    RETURN; -- không đủ quyền -> bỏ qua, không lỗi
  END IF;
  SELECT name INTO _name FROM profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, entity, detail)
  VALUES (auth.uid(), COALESCE(_name, ''), _role, _action, _entity, _detail);
END; $$;

GRANT EXECUTE ON FUNCTION public.log_audit(TEXT, TEXT, TEXT) TO authenticated;
