-- ============================================================
-- MIGRATION 021: Nhắc học phí & bài tập (reminders)
-- Hai hàm RPC sinh notification nhắc nhở, chạy server-side trong 1 lượt
-- (an toàn hơn vòng lặp client, tuân RLS gốc của notifications):
--   - remind_overdue_payments(): Admin — nhắc mọi khoản chưa 'Paid'.
--   - remind_pending_homework(): Teacher/Admin — nhắc HS chưa nộp bài đang mở.
-- Có chống spam: bỏ qua user đã nhận nhắc cùng loại trong 6 giờ gần đây.
-- Trả về SỐ thông báo đã tạo. Nút bấm trong app gọi các hàm này; sau này có
-- thể lịch hoá tự động bằng pg_cron gọi đúng 2 hàm này.
-- Run in: Supabase SQL Editor (sau 006, 017).
-- ============================================================

-- ── Nhắc học phí (Admin) — icon '⏰' ──────────────────────────
CREATE OR REPLACE FUNCTION public.remind_overdue_payments()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cnt INTEGER;
BEGIN
  IF public.my_role() <> 'Admin' THEN RETURN -1; END IF;  -- -1 = không đủ quyền
  INSERT INTO notifications (user_id, icon, message)
  SELECT p.user_id, '⏰',
    'Nhắc học phí: khoản $' || p.amount || ' ' ||
    (CASE WHEN p.status = 'Overdue'
          THEN 'ĐÃ QUÁ HẠN'
          ELSE 'đến hạn ' || COALESCE(p.due_date::TEXT, '—') END) ||
    '. Vui lòng hoàn tất thanh toán.'
  FROM payments p
  WHERE p.status <> 'Paid'
    AND p.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = p.user_id AND n.icon = '⏰'
        AND n.created_at > now() - interval '6 hours'
    );
  GET DIAGNOSTICS _cnt = ROW_COUNT;
  RETURN _cnt;
END; $$;
GRANT EXECUTE ON FUNCTION public.remind_overdue_payments() TO authenticated;

-- ── Nhắc nộp bài (Teacher/Admin) — icon '📌' ─────────────────
CREATE OR REPLACE FUNCTION public.remind_pending_homework()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cnt INTEGER; _role TEXT := public.my_role();
BEGIN
  IF _role NOT IN ('Teacher','Admin') THEN RETURN -1; END IF;
  INSERT INTO notifications (user_id, icon, message)
  SELECT cm.user_id, '📌',
    'Nhắc nộp bài: "' || a.title || '" (hạn ' || COALESCE(a.due_date::TEXT, '—') ||
    ') — bạn chưa nộp.'
  FROM assignments a
  JOIN class_members cm ON cm.class_id = a.class_id
  WHERE a.status = 'open'
    AND a.class_id IS NOT NULL
    AND (_role = 'Admin' OR a.owner_id = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM assignment_submissions s
      WHERE s.assignment_id = a.id AND s.student_id = cm.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = cm.user_id AND n.icon = '📌'
        AND n.created_at > now() - interval '6 hours'
    );
  GET DIAGNOSTICS _cnt = ROW_COUNT;
  RETURN _cnt;
END; $$;
GRANT EXECUTE ON FUNCTION public.remind_pending_homework() TO authenticated;

-- ── (Tuỳ chọn) Lịch tự động bằng pg_cron ─────────────────────
-- Nếu đã bật extension pg_cron, có thể chạy 2 dòng dưới để nhắc mỗi sáng 8h:
--   SELECT cron.schedule('remind-payments','0 1 * * *',$$SELECT public.remind_overdue_payments()$$);
--   SELECT cron.schedule('remind-homework','0 1 * * *',$$SELECT public.remind_pending_homework()$$);
-- (giờ UTC; 01:00 UTC ≈ 08:00 giờ VN). Bỏ comment khi cần.
