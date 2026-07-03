-- ============================================================
-- MIGRATION 013: Siết phân quyền (thực thi ở tầng DB)
-- - Admin sửa được điểm của MỌI học viên
-- - GV KHÔNG được sửa điểm (math_score/eng_score) — kể cả gọi API trực tiếp
--   (RLS là row-level nên không chặn theo cột được -> dùng trigger)
-- - Học phí: admin-only đã có ở 006; lớp: admin-all ở 010; điểm danh ở 011
-- Run in: Supabase SQL Editor (sau 001-012)
-- ============================================================

-- ── 1. Admin đọc/sửa mọi hồ sơ học viên ─────────────────────
DROP POLICY IF EXISTS "Admin manages all students" ON students;
CREATE POLICY "Admin manages all students" ON students FOR ALL
  USING (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');

-- ── 2. Chặn thay đổi điểm nếu KHÔNG phải admin ──────────────
-- Áp cho mọi UPDATE trên students: nếu người gọi không phải Admin mà cố đổi
-- math_score/eng_score -> báo lỗi. GV vẫn sửa được tên/lớp/điểm danh...
CREATE OR REPLACE FUNCTION public.guard_student_scores()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.my_role() <> 'Admin' THEN
    IF NEW.math_score IS DISTINCT FROM OLD.math_score
       OR NEW.eng_score IS DISTINCT FROM OLD.eng_score THEN
      RAISE EXCEPTION 'Chỉ admin được chỉnh điểm học viên';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_student_scores ON students;
CREATE TRIGGER trg_guard_student_scores
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION public.guard_student_scores();

-- ── VERIFY (chạy riêng) ─────────────────────────────────────
-- Đăng nhập GV rồi thử UPDATE students SET math_score=99 -> phải lỗi.
-- Đăng nhập Admin thì đổi điểm bình thường.
