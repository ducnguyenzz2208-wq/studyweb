-- ============================================================
-- MIGRATION 010: Admin toàn quyền quản lý classes (để phân GV vào lớp)
-- Admin có thể đổi owner_id của lớp -> gán lớp cho 1 giáo viên.
-- Run in: Supabase SQL Editor (sau 001-009)
-- ============================================================

DROP POLICY IF EXISTS "Admin manages all classes" ON classes;
CREATE POLICY "Admin manages all classes" ON classes FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');
