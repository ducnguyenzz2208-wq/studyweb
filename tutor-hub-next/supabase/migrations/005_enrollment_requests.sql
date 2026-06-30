-- ============================================================
-- MIGRATION 005: Parent enrollment requests + approval
-- - enrollment_requests: phụ huynh xin cho con vào lớp
-- - approve_enrollment(): GV chủ lớp / Admin duyệt -> HS vào class_members
-- - mở list_class_members / add_class_member cho cả Admin (không chỉ chủ lớp)
-- Run in: Supabase SQL Editor (sau 001-004)
-- ============================================================

-- ── 1. Bảng yêu cầu vào lớp ─────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollment_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id      UUID REFERENCES classes(id)    ON DELETE CASCADE NOT NULL,
  requester_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  -- phụ huynh gửi
  student_email TEXT NOT NULL,        -- email tài khoản học sinh (con)
  student_name  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- ── 2. RLS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Requester manages own requests" ON enrollment_requests;
DROP POLICY IF EXISTS "Owner reads class requests"      ON enrollment_requests;
DROP POLICY IF EXISTS "Owner updates class requests"    ON enrollment_requests;
DROP POLICY IF EXISTS "Admin reads requests"            ON enrollment_requests;

-- Phụ huynh: tạo + xem yêu cầu của chính mình
CREATE POLICY "Requester manages own requests" ON enrollment_requests FOR ALL
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- GV chủ lớp: xem yêu cầu của lớp mình
CREATE POLICY "Owner reads class requests" ON enrollment_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM classes c WHERE c.id = enrollment_requests.class_id AND c.owner_id = auth.uid()));

-- GV chủ lớp: cập nhật trạng thái (từ chối)
CREATE POLICY "Owner updates class requests" ON enrollment_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM classes c WHERE c.id = enrollment_requests.class_id AND c.owner_id = auth.uid()))
  WITH CHECK (true);

-- Admin: xem + cập nhật tất cả
CREATE POLICY "Admin reads requests" ON enrollment_requests FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');

-- ── 3. RPC duyệt yêu cầu ────────────────────────────────────
-- 'ok' | 'not_found' | 'not_allowed' | 'no_user'
CREATE OR REPLACE FUNCTION public.approve_enrollment(_request_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _req enrollment_requests; _uid UUID; _allowed BOOLEAN;
BEGIN
  SELECT * INTO _req FROM enrollment_requests WHERE id = _request_id;
  IF _req.id IS NULL THEN RETURN 'not_found'; END IF;
  SELECT (EXISTS (SELECT 1 FROM classes WHERE id = _req.class_id AND owner_id = auth.uid())
          OR public.my_role() = 'Admin') INTO _allowed;
  IF NOT _allowed THEN RETURN 'not_allowed'; END IF;
  SELECT id INTO _uid FROM auth.users WHERE email = lower(trim(_req.student_email)) LIMIT 1;
  IF _uid IS NULL THEN RETURN 'no_user'; END IF;
  INSERT INTO class_members (class_id, user_id) VALUES (_req.class_id, _uid)
    ON CONFLICT (class_id, user_id) DO NOTHING;
  UPDATE enrollment_requests SET status = 'approved' WHERE id = _request_id;
  RETURN 'ok';
END; $$;
GRANT EXECUTE ON FUNCTION public.approve_enrollment(UUID) TO authenticated;

-- ── 4. Mở list/add thành viên cho cả Admin (không chỉ chủ lớp) ─
CREATE OR REPLACE FUNCTION public.add_class_member(_class_id UUID, _email TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID;
BEGIN
  IF NOT (EXISTS (SELECT 1 FROM classes WHERE id = _class_id AND owner_id = auth.uid())
          OR public.my_role() = 'Admin') THEN
    RETURN 'not_owner';
  END IF;
  SELECT id INTO _uid FROM auth.users WHERE email = lower(trim(_email)) LIMIT 1;
  IF _uid IS NULL THEN RETURN 'no_user'; END IF;
  INSERT INTO class_members (class_id, user_id) VALUES (_class_id, _uid)
    ON CONFLICT (class_id, user_id) DO NOTHING;
  RETURN 'ok';
END; $$;
GRANT EXECUTE ON FUNCTION public.add_class_member(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_class_members(_class_id UUID)
RETURNS TABLE (member_id UUID, user_id UUID, email TEXT, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (EXISTS (SELECT 1 FROM classes WHERE id = _class_id AND owner_id = auth.uid())
          OR public.my_role() = 'Admin') THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT cm.id, cm.user_id, u.email::TEXT, COALESCE(p.name, u.email::TEXT)
    FROM class_members cm
    JOIN auth.users u ON u.id = cm.user_id
    LEFT JOIN profiles p ON p.id = cm.user_id
    WHERE cm.class_id = _class_id
    ORDER BY COALESCE(p.name, u.email::TEXT);
END; $$;
GRANT EXECUTE ON FUNCTION public.list_class_members(UUID) TO authenticated;

-- ── 5. Admin quản lý class_members mọi lớp (cho nút thêm ở User Mgmt) ─
DROP POLICY IF EXISTS "Admin manages all class members" ON class_members;
CREATE POLICY "Admin manages all class members" ON class_members FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');
