-- ============================================================
-- MIGRATION 008: Admin đọc được TẤT CẢ lớp
-- Để admin click/quản lý mọi lớp; GV vẫn chỉ lớp mình, HS chỉ lớp tham gia.
-- Run in: Supabase SQL Editor (sau 001-007)
-- ============================================================

DROP POLICY IF EXISTS "Admin reads all classes" ON classes;
CREATE POLICY "Admin reads all classes" ON classes FOR SELECT
  USING (public.my_role() = 'Admin');
