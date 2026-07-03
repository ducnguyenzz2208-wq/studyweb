-- ============================================================
-- MIGRATION 012: Quyền ĐỌC cho cổng Học viên / Phụ huynh
-- - HV (thành viên lớp) đọc lịch học lớp mình
-- - HV đọc điểm danh của chính mình (khớp qua students.email)
-- - PH đọc điểm danh / học phí / lịch học của con (linked_student_id)
-- - approve_enrollment: duyệt xong tự liên kết PH -> hồ sơ con
-- LƯU Ý: không query auth.users trực tiếp trong policy (bẫy 401 - xem 003);
--        dùng helper SECURITY DEFINER.
-- Run in: Supabase SQL Editor (sau 001-011)
-- ============================================================

-- ── 1. Helper: user_id (auth) của học sinh mà phụ huynh được liên kết ─
CREATE OR REPLACE FUNCTION public.linked_student_user_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT u.id FROM auth.users u
  JOIN students st ON lower(st.email) = lower(u.email)
  WHERE st.id = (SELECT linked_student_id FROM profiles WHERE id = auth.uid())
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.linked_student_user_id() TO authenticated;

-- ── 2. Lịch học ─────────────────────────────────────────────
-- Thành viên lớp đọc các buổi của lớp mình (khớp theo tên lớp)
DROP POLICY IF EXISTS "Class members read class schedule" ON schedule_events;
CREATE POLICY "Class members read class schedule" ON schedule_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM classes c
    WHERE c.name = schedule_events.class_name AND public.is_class_member(c.id)
  ));

-- Phụ huynh đọc lịch của lớp con mình
DROP POLICY IF EXISTS "Parents read linked student schedule" ON schedule_events;
CREATE POLICY "Parents read linked student schedule" ON schedule_events FOR SELECT
  USING (schedule_events.class_name = (
    SELECT st.class_name FROM students st
    WHERE st.id = (SELECT linked_student_id FROM profiles WHERE id = auth.uid())
    LIMIT 1
  ));

-- ── 3. Điểm danh ────────────────────────────────────────────
-- HV đọc điểm danh của chính mình (student_ref khớp hồ sơ có email của mình)
DROP POLICY IF EXISTS "Students read own attendance by email" ON attendance_records;
CREATE POLICY "Students read own attendance by email" ON attendance_records FOR SELECT
  USING (student_ref IN (
    SELECT id::text FROM students WHERE email = (auth.jwt() ->> 'email')
  ));

-- PH đọc điểm danh của con
DROP POLICY IF EXISTS "Parents read linked student attendance" ON attendance_records;
CREATE POLICY "Parents read linked student attendance" ON attendance_records FOR SELECT
  USING (student_ref = (
    SELECT linked_student_id::text FROM profiles WHERE id = auth.uid()
  ));

-- ── 4. Học phí: PH đọc khoản thu của con ────────────────────
DROP POLICY IF EXISTS "Parents read linked student payments" ON payments;
CREATE POLICY "Parents read linked student payments" ON payments FOR SELECT
  USING (user_id = public.linked_student_user_id());

-- ── 5. Duyệt yêu cầu: tự liên kết phụ huynh với hồ sơ con ───
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
  -- Liên kết phụ huynh -> hồ sơ học sinh (nếu có hồ sơ khớp email, chưa link)
  UPDATE profiles SET linked_student_id = (
    SELECT id FROM students WHERE lower(email) = lower(trim(_req.student_email)) LIMIT 1
  )
  WHERE id = _req.requester_id AND linked_student_id IS NULL;
  RETURN 'ok';
END; $$;
GRANT EXECUTE ON FUNCTION public.approve_enrollment(UUID) TO authenticated;
