-- ============================================================
-- MIGRATION 011: Quyền truy cập điểm danh
-- - Admin quản lý MỌI bản ghi điểm danh (không chỉ của mình)
-- - GV chủ lớp đọc được điểm danh của lớp mình (kể cả admin điểm)
-- Bảng attendance_records đã có trong schema.sql (UNIQUE teacher_id,
-- student_ref, session_date); tạo lại IF NOT EXISTS cho an toàn.
-- Run in: Supabase SQL Editor (sau 001-010)
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_ref  TEXT NOT NULL,
  student_name TEXT,
  class_name   TEXT,
  session_date DATE NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('present','absent','late')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, student_ref, session_date)
);
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Admin: toàn quyền trên mọi bản ghi
DROP POLICY IF EXISTS "Admin manages all attendance" ON attendance_records;
CREATE POLICY "Admin manages all attendance" ON attendance_records FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');

-- GV chủ lớp: đọc điểm danh của lớp mình (khớp theo tên lớp)
DROP POLICY IF EXISTS "Class owner reads class attendance" ON attendance_records;
CREATE POLICY "Class owner reads class attendance" ON attendance_records FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM classes c
    WHERE c.name = attendance_records.class_name AND c.owner_id = auth.uid()
  ));
