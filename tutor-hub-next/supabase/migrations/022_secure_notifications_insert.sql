-- ============================================================
-- MIGRATION 022: Bịt lỗ hổng chèn notifications
-- VẤN ĐỀ: policy ở 017 ("Anyone authenticated can insert notifications")
-- cho BẤT KỲ user đã đăng nhập nào chèn thông báo tới user_id BẤT KỲ →
-- học sinh có thể giả mạo / spam thông báo cho người khác.
-- SỬA: bỏ policy INSERT rộng. Sau đó CLIENT không insert trực tiếp được nữa;
-- mọi thông báo sinh ra qua trigger/RPC SECURITY DEFINER (chạy bằng quyền
-- owner nên bỏ qua RLS) — 017 (trigger tự động), 021 (nhắc hàng loạt) và
-- send_payment_reminder() bên dưới (nhắc 1 khoản, chỉ Admin).
-- LƯU Ý: nếu chạy lại 017 sau này (nó tạo lại policy rộng) thì phải chạy lại 022.
-- Run in: Supabase SQL Editor (sau 017, 021).
-- ============================================================

-- Gỡ policy INSERT rộng (không còn cho client tự chèn notification).
DROP POLICY IF EXISTS "Anyone authenticated can insert notifications" ON public.notifications;

-- Nhắc đóng học phí cho MỘT khoản (chỉ Admin). Nội dung message dựng server-side
-- để client không thể tự bịa thông báo gửi người khác.
-- Trả về: 'ok' | 'not_admin' | 'no_payment' | 'no_user'
CREATE OR REPLACE FUNCTION public.send_payment_reminder(_payment_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID; _amount NUMERIC; _note TEXT; _due DATE; _status TEXT;
BEGIN
  IF public.my_role() <> 'Admin' THEN RETURN 'not_admin'; END IF;
  SELECT user_id, amount, note, due_date, status
    INTO _uid, _amount, _note, _due, _status
    FROM payments WHERE id = _payment_id;
  IF NOT FOUND THEN RETURN 'no_payment'; END IF;
  IF _uid IS NULL THEN RETURN 'no_user'; END IF;
  INSERT INTO notifications (user_id, icon, message)
  VALUES (_uid, '💳',
    'Nhắc đóng học phí: khoản $' || _amount ||
    ' cho "' || COALESCE(NULLIF(_note, ''), 'Học phí') || '" ' ||
    (CASE WHEN _status = 'Overdue'
          THEN 'ĐÃ QUÁ HẠN'
          ELSE 'đến hạn ' || COALESCE(_due::TEXT, '—') END) ||
    '. Vui lòng hoàn tất thanh toán.');
  RETURN 'ok';
END; $$;

GRANT EXECUTE ON FUNCTION public.send_payment_reminder(UUID) TO authenticated;
