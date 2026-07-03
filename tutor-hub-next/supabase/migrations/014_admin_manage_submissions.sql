-- ============================================================
-- MIGRATION 014: Admin quản lý mọi bài nộp (sửa/xóa/chấm)
-- HS xóa bài của mình đã có ("Students manage own submissions");
-- GV chủ bài tập đã có ("Owner grades submissions"). Bổ sung admin-all.
-- Run in: Supabase SQL Editor (sau 001-013)
-- ============================================================

DROP POLICY IF EXISTS "Admin manages all submissions" ON assignment_submissions;
CREATE POLICY "Admin manages all submissions" ON assignment_submissions FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');
