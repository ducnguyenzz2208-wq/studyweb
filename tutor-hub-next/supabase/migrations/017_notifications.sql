-- ============================================================
-- MIGRATION 017: Notifications + RLS + Triggers
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  icon        TEXT,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone authenticated can insert notifications" ON notifications;

-- Users can read their own notifications
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (e.g. mark as read) their own notifications
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Authenticated users can insert notifications
CREATE POLICY "Anyone authenticated can insert notifications" ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');


-- ── TRIGGERS FOR AUTO-GENERATING NOTIFICATIONS ───────────────

-- 1. Trigger on homework submission insert
CREATE OR REPLACE FUNCTION public.notify_on_submission_insert()
RETURNS TRIGGER AS $$
DECLARE
  _owner_id UUID;
  _title TEXT;
BEGIN
  -- Get assignment owner and title
  SELECT owner_id, title INTO _owner_id, _title FROM assignments WHERE id = NEW.assignment_id;
  
  -- Notify assignment teacher
  IF _owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, icon, message)
    VALUES (_owner_id, '📥', COALESCE(NEW.student_name, 'Học sinh') || ' đã nộp bài "' || _title || '" — chưa chấm.');
  END IF;
  
  -- Also notify all Admin profiles (excluding the teacher who is already notified)
  INSERT INTO notifications (user_id, icon, message)
  SELECT id, '📥', COALESCE(NEW.student_name, 'Học sinh') || ' đã nộp bài "' || _title || '" — chưa chấm.'
  FROM profiles
  WHERE role = 'Admin' AND id <> COALESCE(_owner_id, '00000000-0000-0000-0000-000000000000'::UUID);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_submission_insert ON assignment_submissions;
CREATE TRIGGER on_submission_insert
  AFTER INSERT ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_submission_insert();


-- 2. Trigger on homework graded
CREATE OR REPLACE FUNCTION public.notify_on_submission_grade()
RETURNS TRIGGER AS $$
DECLARE
  _title TEXT;
BEGIN
  IF NEW.grade IS NOT NULL AND (OLD.grade IS NULL OR NEW.grade <> OLD.grade) THEN
    SELECT title INTO _title FROM assignments WHERE id = NEW.assignment_id;
    INSERT INTO notifications (user_id, icon, message)
    VALUES (NEW.student_id, '🎯', 'Bài "' || COALESCE(_title, '') || '" đã được chấm: ' || NEW.grade || '/10.');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_submission_grade ON assignment_submissions;
CREATE TRIGGER on_submission_grade
  AFTER UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_submission_grade();


-- 3. Trigger on enrollment request insert
CREATE OR REPLACE FUNCTION public.notify_on_enrollment_request()
RETURNS TRIGGER AS $$
DECLARE
  _class_owner UUID;
  _class_name TEXT;
BEGIN
  SELECT owner_id, name INTO _class_owner, _class_name FROM classes WHERE id = NEW.class_id;
  
  -- Notify class teacher
  IF _class_owner IS NOT NULL THEN
    INSERT INTO notifications (user_id, icon, message)
    VALUES (_class_owner, '📩', COALESCE(NEW.student_name, NEW.student_email) || ' xin vào lớp ' || COALESCE(_class_name, '') || '.');
  END IF;

  -- Also notify all Admins (excluding class teacher)
  INSERT INTO notifications (user_id, icon, message)
  SELECT id, '📩', COALESCE(NEW.student_name, NEW.student_email) || ' xin vào lớp ' || COALESCE(_class_name, '') || '.'
  FROM profiles
  WHERE role = 'Admin' AND id <> COALESCE(_class_owner, '00000000-0000-0000-0000-000000000000'::UUID);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_enrollment_request ON enrollment_requests;
CREATE TRIGGER on_enrollment_request
  AFTER INSERT ON enrollment_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_enrollment_request();


-- 4. Trigger on enrollment request status update (approval/rejection)
CREATE OR REPLACE FUNCTION public.notify_on_enrollment_response()
RETURNS TRIGGER AS $$
DECLARE
  _class_name TEXT;
BEGIN
  IF NEW.status <> OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    SELECT name INTO _class_name FROM classes WHERE id = NEW.class_id;
    INSERT INTO notifications (user_id, icon, message)
    VALUES (NEW.requester_id, '📩', 'Yêu cầu vào lớp ' || COALESCE(_class_name, '') || ' đã được ' || (CASE WHEN NEW.status = 'approved' THEN 'duyệt' ELSE 'từ chối' END) || '.');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_enrollment_response ON enrollment_requests;
CREATE TRIGGER on_enrollment_response
  AFTER UPDATE ON enrollment_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_enrollment_response();


-- 5. Trigger on payment insert (Notify student/parent)
CREATE OR REPLACE FUNCTION public.notify_on_payment_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, icon, message)
  VALUES (NEW.user_id, '💳', 'Học phí mới phát sinh: $' || NEW.amount || ' (Hạn đóng: ' || COALESCE(NEW.due_date::TEXT, '—') || '). Ghi chú: ' || COALESCE(NEW.note, '—'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_payment_insert ON payments;
CREATE TRIGGER on_payment_insert
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment_insert();
