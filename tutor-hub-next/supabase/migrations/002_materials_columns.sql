-- ============================================================
-- MIGRATION 002: Materials table — missing columns + policies
-- Problem: UploadForm calls storage.upload() + DB insert but
--          columns file_path, file_url, category, file_type
--          don't exist → insert fails silently → data lost on refresh
-- ============================================================

-- ── STEP 1: Add missing columns ─────────────────────────────
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS file_path   TEXT,
  ADD COLUMN IF NOT EXISTS file_url    TEXT,
  ADD COLUMN IF NOT EXISTS category    TEXT,
  ADD COLUMN IF NOT EXISTS file_type   TEXT,
  ADD COLUMN IF NOT EXISTS class_name  TEXT,
  ADD COLUMN IF NOT EXISTS file_name   TEXT;

-- ── STEP 2: Insert/Delete policies for Admin/Teacher ────────
-- (my_role() must exist — run 001 first)

DROP POLICY IF EXISTS "Admin/Teacher insert materials"        ON materials;
DROP POLICY IF EXISTS "Admin/Teacher delete own materials"    ON materials;

CREATE POLICY "Admin/Teacher insert materials"
  ON materials FOR INSERT
  WITH CHECK (public.my_role() IN ('Admin','Teacher'));

CREATE POLICY "Admin/Teacher delete own materials"
  ON materials FOR DELETE
  USING (
    auth.uid() = owner_id
    OR public.my_role() = 'Admin'
  );

-- ── STEP 3: Storage bucket for materials ────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('materials', 'materials', true)
  ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public read materials bucket"    ON storage.objects;
DROP POLICY IF EXISTS "Auth upload materials bucket"    ON storage.objects;
DROP POLICY IF EXISTS "Owner delete materials bucket"   ON storage.objects;

CREATE POLICY "Public read materials bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials');

CREATE POLICY "Auth upload materials bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Owner delete materials bucket"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'materials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
