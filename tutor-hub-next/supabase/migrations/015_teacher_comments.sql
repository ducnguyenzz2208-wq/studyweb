-- ============================================================
-- MIGRATION 015: Nhận xét học viên (teacher_comments) — hoàn thiện
-- - Thêm teacher_name để hiển thị ai nhận xét
-- - Admin quản lý mọi nhận xét
-- - Phụ huynh đọc nhận xét của con (linked_student_id)
-- Bảng teacher_comments đã có ở schema.sql; policy HS đọc đã sửa ở 003.
-- Run in: Supabase SQL Editor (sau 001-014)
-- ============================================================

ALTER TABLE teacher_comments ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- Admin: toàn quyền
DROP POLICY IF EXISTS "Admin manages all comments" ON teacher_comments;
CREATE POLICY "Admin manages all comments" ON teacher_comments FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');

-- Phụ huynh: đọc nhận xét về con
DROP POLICY IF EXISTS "Parents read child comments" ON teacher_comments;
CREATE POLICY "Parents read child comments" ON teacher_comments FOR SELECT
  USING (student_id = (SELECT linked_student_id FROM profiles WHERE id = auth.uid()));
