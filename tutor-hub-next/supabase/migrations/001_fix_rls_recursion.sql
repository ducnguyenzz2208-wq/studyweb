-- ============================================================
-- MIGRATION 001: Fix RLS infinite recursion
-- Problem: policies on `profiles` query `profiles` again
--          → any table that checks role via EXISTS(FROM profiles)
--          triggers profiles RLS → triggers itself → 500 error
-- Fix: SECURITY DEFINER helper function bypasses RLS entirely
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── STEP 1: Create my_role() helper ─────────────────────────
-- SECURITY DEFINER runs as the function owner, bypassing RLS.
-- STABLE tells Postgres it can cache the result within a query.
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.my_role() TO authenticated;


-- ── STEP 2: Fix profiles table (the root cause) ──────────────
-- These two policies query FROM profiles while already inside a
-- profiles policy evaluation → infinite recursion → 500.

DROP POLICY IF EXISTS "Admin reads all profiles"   ON profiles;
DROP POLICY IF EXISTS "Admin updates any profile"  ON profiles;

CREATE POLICY "Admin reads all profiles"
  ON profiles FOR SELECT
  USING (public.my_role() = 'Admin');

CREATE POLICY "Admin updates any profile"
  ON profiles FOR UPDATE
  USING     (public.my_role() = 'Admin')
  WITH CHECK (public.my_role() = 'Admin');


-- ── STEP 3: Fix subjects ─────────────────────────────────────
DROP POLICY IF EXISTS "Teacher/Student read all subjects" ON subjects;

CREATE POLICY "Teacher/Student read all subjects"
  ON subjects FOR SELECT
  USING (public.my_role() IN ('Admin','Teacher','Student','Parent'));


-- ── STEP 4: Fix materials ────────────────────────────────────
DROP POLICY IF EXISTS "Admin/Teacher read all materials" ON materials;
DROP POLICY IF EXISTS "Students/Parents read all materials" ON materials;

CREATE POLICY "All roles read all materials"
  ON materials FOR SELECT
  USING (public.my_role() IN ('Admin','Teacher','Student','Parent'));

-- Insert: only Admin/Teacher
DROP POLICY IF EXISTS "Admin/Teacher insert materials" ON materials;

CREATE POLICY "Admin/Teacher insert materials"
  ON materials FOR INSERT
  WITH CHECK (public.my_role() IN ('Admin','Teacher'));


-- ── STEP 5: Fix classes ──────────────────────────────────────
DROP POLICY IF EXISTS "Students/Parents read classes" ON classes;

CREATE POLICY "Students/Parents read classes"
  ON classes FOR SELECT
  USING (public.my_role() IN ('Student','Parent','Admin','Teacher'));


-- ── STEP 6: Fix homework ─────────────────────────────────────
DROP POLICY IF EXISTS "Students/Parents read homework" ON homework;

CREATE POLICY "Students/Parents read homework"
  ON homework FOR SELECT
  USING (public.my_role() IN ('Student','Parent'));


-- ── STEP 7: Fix assignments ──────────────────────────────────
DROP POLICY IF EXISTS "Students/Parents read assignments" ON assignments;

CREATE POLICY "Students/Parents read assignments"
  ON assignments FOR SELECT
  USING (public.my_role() IN ('Student','Parent'));


-- ── STEP 8: Fix assignment_submissions ──────────────────────
DROP POLICY IF EXISTS "Teacher/Admin read/grade all submissions" ON assignment_submissions;

CREATE POLICY "Teacher/Admin read/grade all submissions"
  ON assignment_submissions FOR ALL
  USING     (public.my_role() IN ('Admin','Teacher'))
  WITH CHECK (public.my_role() IN ('Admin','Teacher'));


-- ── STEP 9: Fix assignment_comments ─────────────────────────
DROP POLICY IF EXISTS "Users read assignment comments" ON assignment_comments;
DROP POLICY IF EXISTS "Users delete own comments"      ON assignment_comments;

CREATE POLICY "Users read assignment comments"
  ON assignment_comments FOR SELECT
  USING (public.my_role() IN ('Admin','Teacher','Student','Parent'));

CREATE POLICY "Users delete own comments"
  ON assignment_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.my_role() = 'Admin'
  );


-- ── STEP 10: Fix storage.objects ────────────────────────────
DROP POLICY IF EXISTS "Teacher/Admin read all submission files" ON storage.objects;

CREATE POLICY "Teacher/Admin read all submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tutor-hub'
    AND public.my_role() IN ('Admin','Teacher')
  );


-- ── VERIFY (run separately to check) ────────────────────────
-- SELECT public.my_role();            -- should return your role
-- SELECT * FROM profiles LIMIT 5;    -- should NOT return 500
