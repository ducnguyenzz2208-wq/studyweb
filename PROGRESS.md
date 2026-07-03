# Tutor Hub - Progress

## Đã xong
- #4 Lịch tuần: grid T2-CN, nút tuần trước/sau, click ô để thêm/sửa
- #5 Thông báo DB: bảng + trigger tự sinh (badge còn lệch — đang chuẩn hoá đọc từ DB)
- #6 Hóa đơn: in/PDF + nút nhắc đóng
- #7 Đổi/quên mật khẩu: Settings + trang /reset-password

## Đang làm
- Chuẩn hoá badge thông báo: chuyển buildNotifications từ tính client-side sang đọc trực tiếp từ bảng `notifications` trong DB để đồng nhất với #5

## Việc thủ công cần làm
- [ ] Chạy migration `017_notifications.sql` trong Supabase SQL Editor
- [ ] Supabase → Authentication → URL Configuration: đảm bảo Redirect URLs có `https://studyweb-swart.vercel.app/**`
- [ ] Chờ Vercel build commit `c1eb38d` xong rồi test lại luồng reset password

## Lưu ý khi làm việc
- Không chạy song song nhiều agent/phiên Claude Code trên cùng repo này — dễ ghi đè lẫn nhau
- Trước khi bắt đầu phiên mới: đọc file này trước, không cần kể lại từ đầu

## Schema / quyết định kỹ thuật (điền thêm nếu cần)
- Bảng `notifications`: id, user_id (FK auth.users), icon, message, is_read, created_at
- RLS bật trên `notifications`, policy theo user_id
