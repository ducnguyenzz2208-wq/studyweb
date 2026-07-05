-- ============================================================
-- MIGRATION 019: Bật Supabase Realtime cho bảng notifications
-- Client (01-core-state.js → subscribeNotifications) đã lắng nghe
-- postgres_changes trên public.notifications, NHƯNG sẽ không nhận được
-- sự kiện nào cho tới khi bảng được thêm vào publication supabase_realtime.
-- Migration này thêm bảng vào publication (idempotent) + đảm bảo REPLICA
-- IDENTITY đủ để payload UPDATE/DELETE có dữ liệu lọc theo user_id.
-- Run in: Supabase SQL Editor. RLS ở 017 vẫn kiểm soát ai nhận được gì.
-- ============================================================

-- Thêm bảng vào publication realtime nếu chưa có (không lỗi khi chạy lại).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Để payload của UPDATE/DELETE mang đủ cột (đặc biệt user_id dùng cho filter
-- 'user_id=eq.<uid>' phía client) — REPLICA IDENTITY FULL.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
