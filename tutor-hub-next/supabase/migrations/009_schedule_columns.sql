-- ============================================================
-- MIGRATION 009: Thêm cột cho schedule_events (đủ field cho UI Schedule)
-- Run in: Supabase SQL Editor (sau 001-008)
-- ============================================================

ALTER TABLE schedule_events
  ADD COLUMN IF NOT EXISTS class_name TEXT,
  ADD COLUMN IF NOT EXISTS teacher    TEXT,
  ADD COLUMN IF NOT EXISTS room       TEXT,
  ADD COLUMN IF NOT EXISTS status     TEXT;
