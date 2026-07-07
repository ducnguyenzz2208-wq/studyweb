-- ============================================================
-- MIGRATION 025: Kỳ học theo TUẦN cho lớp (Moodle-style)
-- Thêm 2 cột vào classes để GV/Admin đặt "Tuần 1 bắt đầu ngày…" + số tuần.
-- Class-feed sẽ gom bài tập theo tuần (dựa due_date) + mục General.
-- Idempotent. Run in: Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS term_start DATE,
  ADD COLUMN IF NOT EXISTS term_weeks INTEGER;

-- Cho Admin cập nhật MỌI lớp (để admin cũng đặt được kỳ học, không chỉ GV chủ lớp).
-- (Chính sách gốc "Teacher/Admin manage classes" chỉ cho chủ sở hữu owner_id.)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='classes' AND policyname='Admin updates any class') THEN
    CREATE POLICY "Admin updates any class"
      ON public.classes FOR UPDATE
      USING (public.my_role() = 'Admin')
      WITH CHECK (public.my_role() = 'Admin');
  END IF;
END $$;
