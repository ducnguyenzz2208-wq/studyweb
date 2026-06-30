-- ============================================================
-- MIGRATION 004: Class Feed (Facebook-style assignments)
-- - class_members: ai thuộc lớp nào (GV quản lý)
-- - assignments.class_id: gắn post vào đúng lớp
-- - is_class_member(): helper RLS (tránh đệ quy / auth.users)
-- - add_class_member(): RPC thêm HS bằng email
-- - RLS phương án B: mọi thành viên lớp thấy bài nộp của nhau
-- Run in: Supabase Dashboard -> SQL Editor (sau 001, 002, 003)
-- ============================================================

-- ── 1. Bảng thành viên lớp ──────────────────────────────────
CREATE TABLE IF NOT EXISTS class_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id   UUID REFERENCES classes(id)    ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- ── 2. Gắn lớp cho bài tập ──────────────────────────────────
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- ── 3. Helper: user hiện tại có thuộc lớp không? ────────────
-- SECURITY DEFINER bỏ qua RLS của class_members -> không đệ quy.
CREATE OR REPLACE FUNCTION public.is_class_member(_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_members
    WHERE class_id = _class_id AND user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_class_member(UUID) TO authenticated;

-- ── 4. RLS class_members ────────────────────────────────────
DROP POLICY IF EXISTS "Owner manages class members" ON class_members;
DROP POLICY IF EXISTS "Member reads own membership" ON class_members;

CREATE POLICY "Owner manages class members" ON class_members FOR ALL
  USING      (EXISTS (SELECT 1 FROM classes c WHERE c.id = class_members.class_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM classes c WHERE c.id = class_members.class_id AND c.owner_id = auth.uid()));

CREATE POLICY "Member reads own membership" ON class_members FOR SELECT
  USING (user_id = auth.uid());

-- ── 5. RPC: thêm thành viên bằng email ──────────────────────
-- Trả về: 'ok' | 'not_owner' | 'no_user'
CREATE OR REPLACE FUNCTION public.add_class_member(_class_id UUID, _email TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM classes WHERE id = _class_id AND owner_id = auth.uid()) THEN
    RETURN 'not_owner';
  END IF;
  SELECT id INTO _uid FROM auth.users WHERE email = lower(trim(_email)) LIMIT 1;
  IF _uid IS NULL THEN RETURN 'no_user'; END IF;
  INSERT INTO class_members (class_id, user_id) VALUES (_class_id, _uid)
    ON CONFLICT (class_id, user_id) DO NOTHING;
  RETURN 'ok';
END; $$;
GRANT EXECUTE ON FUNCTION public.add_class_member(UUID, TEXT) TO authenticated;

-- ── 6. RPC: liệt kê thành viên 1 lớp (kèm email/tên) ────────
-- GV chủ lớp xem được danh sách; HS thường không cần.
CREATE OR REPLACE FUNCTION public.list_class_members(_class_id UUID)
RETURNS TABLE (member_id UUID, user_id UUID, email TEXT, name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM classes WHERE id = _class_id AND owner_id = auth.uid()) THEN
    RETURN; -- không phải chủ lớp -> rỗng
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

-- ── 7. RLS assignments: chỉ thành viên lớp đọc ──────────────
DROP POLICY IF EXISTS "Students/Parents read assignments" ON assignments;
DROP POLICY IF EXISTS "Class members read assignments"    ON assignments;

CREATE POLICY "Class members read assignments" ON assignments FOR SELECT
  USING (auth.uid() = owner_id OR public.is_class_member(class_id));

-- ── 8. RLS bài nộp (PHƯƠNG ÁN B: thành viên thấy của nhau) ───
DROP POLICY IF EXISTS "Teacher/Admin read/grade all submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Class members read submissions"           ON assignment_submissions;
DROP POLICY IF EXISTS "Owner grades submissions"                 ON assignment_submissions;

-- "Students manage own submissions" (USING auth.uid()=student_id) giữ nguyên từ schema gốc.

CREATE POLICY "Class members read submissions" ON assignment_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND (a.owner_id = auth.uid() OR public.is_class_member(a.class_id))
  ));

CREATE POLICY "Owner grades submissions" ON assignment_submissions FOR ALL
  USING      (EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_submissions.assignment_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_submissions.assignment_id AND a.owner_id = auth.uid()));

-- ── 9. VERIFY (chạy riêng để kiểm tra) ──────────────────────
-- SELECT public.is_class_member('<class_id>');
-- SELECT * FROM public.list_class_members('<class_id>');
