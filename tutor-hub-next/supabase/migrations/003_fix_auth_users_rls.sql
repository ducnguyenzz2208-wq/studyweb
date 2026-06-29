-- ============================================================
-- MIGRATION 003: Fix 401 on students + teacher_comments
-- Problem: Two RLS policies do  SELECT email FROM auth.users ...
--          The `authenticated` role has NO privilege on auth.users,
--          so PostgREST aborts the whole query with 401 — even for
--          an Admin whose OTHER policy would have granted access.
--          A 401 also makes the Supabase JS client treat the session
--          as invalid, which is why a refresh drops you back to the
--          login/home page and the data appears to vanish.
-- Fix:     Read the email straight from the JWT — auth.jwt()->>'email'
--          — instead of querying the protected auth.users table.
-- Run in:  Supabase Dashboard -> SQL Editor (run 001 and 002 first)
-- ============================================================

-- ── STUDENTS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students read own record" ON students;

CREATE POLICY "Students read own record"
  ON students FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

-- ── TEACHER COMMENTS ────────────────────────────────────────
DROP POLICY IF EXISTS "Students read comments about them" ON teacher_comments;

CREATE POLICY "Students read comments about them"
  ON teacher_comments FOR SELECT
  USING (
    student_id = (SELECT linked_student_id FROM profiles WHERE id = auth.uid())
    OR
    student_id::TEXT = (
      SELECT id::TEXT FROM students
      WHERE email = (auth.jwt() ->> 'email')
      LIMIT 1
    )
  );

-- ── VERIFY (run separately) ─────────────────────────────────
-- SELECT * FROM students LIMIT 1;          -- should NOT return 401
-- SELECT * FROM teacher_comments LIMIT 1;  -- should NOT return 401
