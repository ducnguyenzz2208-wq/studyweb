-- ============================================================
-- MIGRATION 016: Chấm bài tập -> tự cập nhật điểm TB học viên
-- Khi chấm điểm 1 bài nộp (grade 0-10), tính lại điểm trung bình của học
-- sinh cho MÔN đó và ghi vào students.math_score / eng_score (thang 0-100).
-- Phải "qua mặt" trigger chặn điểm ở 013 -> dùng cờ phiên app.autoscore.
-- Run in: Supabase SQL Editor (sau 001-015)
-- ============================================================

-- 1) Guard cũ cho phép khi cờ autoscore bật (đồng bộ hệ thống)
CREATE OR REPLACE FUNCTION public.guard_student_scores()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(current_setting('app.autoscore', true), '') = '1' THEN
    RETURN NEW; -- cập nhật do hệ thống (chấm bài) -> cho phép
  END IF;
  IF public.my_role() <> 'Admin' THEN
    IF NEW.math_score IS DISTINCT FROM OLD.math_score
       OR NEW.eng_score IS DISTINCT FROM OLD.eng_score THEN
      RAISE EXCEPTION 'Chỉ admin được chỉnh điểm học viên';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- 2) Đồng bộ điểm bài tập -> điểm hồ sơ học sinh
CREATE OR REPLACE FUNCTION public.sync_student_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _subj TEXT; _email TEXT; _avg NUMERIC;
BEGIN
  IF NEW.grade IS NULL THEN RETURN NEW; END IF;
  SELECT subject INTO _subj FROM assignments WHERE id = NEW.assignment_id;
  IF _subj NOT IN ('Math','English') THEN RETURN NEW; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = NEW.student_id;
  IF _email IS NULL THEN RETURN NEW; END IF;
  -- TB các bài đã chấm của HS trong cùng môn, quy về thang 100
  SELECT AVG(s.grade) * 10 INTO _avg
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id
  WHERE s.student_id = NEW.student_id AND a.subject = _subj AND s.grade IS NOT NULL;
  IF _avg IS NULL THEN RETURN NEW; END IF;
  PERFORM set_config('app.autoscore', '1', true);
  IF _subj = 'Math' THEN
    UPDATE students SET math_score = ROUND(_avg) WHERE lower(email) = lower(_email);
  ELSE
    UPDATE students SET eng_score = ROUND(_avg) WHERE lower(email) = lower(_email);
  END IF;
  PERFORM set_config('app.autoscore', '0', true);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_student_score ON assignment_submissions;
CREATE TRIGGER trg_sync_student_score
  AFTER INSERT OR UPDATE OF grade ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_score();

-- VERIFY: chấm 1 bài môn Math cho HS -> students.math_score của HS đó cập nhật.
