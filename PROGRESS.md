# Tutor Hub — Progress

> App quản lý trung tâm gia sư. Live: https://studyweb-swart.vercel.app

## Kiến trúc tổng quan
- **Next.js** (`tutor-hub-next/`) lo phần auth thật + khung ngoài:
  - `/login`, `/signup`, `/reset-password`, `/auth/callback` (OAuth + PKCE), middleware bảo vệ route.
  - `/dashboard` render **iframe** trỏ tới `public/tutor-hub-app.html`, truyền session (access/refresh token) xuống qua `postMessage`.
- **tutor-hub-app.html** là toàn bộ UI ứng dụng (1 file lớn, vanilla JS) — nhận session rồi gọi thẳng Supabase.
- **Supabase**: Auth + Postgres + RLS. 17 migration trong `supabase/migrations/`.
- Phân quyền theo role: `Teacher`, `Admin`, `Parent`, `Student`, `Pending` (xem `ROLE_SECTIONS`).

## Đã làm được (chạy thật với DB)
Các bảng đang dùng: `profiles, students, classes, class_members, subjects, assignments,
assignment_submissions, assignment_comments, homework, teacher_comments, materials,
flashcard_decks, flashcards, attendance_records, schedule_events, payments,
enrollment_requests, notifications`.

- **Auth**: đăng nhập email + Google, đăng ký (role xin duyệt → mặc định `Pending`), middleware chặn route chưa đăng nhập.
- **Dashboard**: welcome block + KPI (số học sinh / lớp / BT chờ).
- **Students**: CRUD học sinh, nhập hàng loạt (paste/CSV), điểm trung bình tự tính.
- **Classes / class members**: lớp học + thành viên, admin gán giáo viên.
- **Assignments**: giao bài, nộp bài, chấm điểm, nhận xét; điểm tự đồng bộ vào điểm TB học sinh (#016).
- **Attendance**: điểm danh theo buổi.
- **Scores**: quản lý điểm.
- **Materials**: tài liệu (upload/liệt kê).
- **Flashcards**: bộ thẻ + thẻ học.
- **Schedule (#4)**: lịch tuần T2–CN, chuyển tuần, click ô để thêm/sửa.
- **Payments (#6)**: hóa đơn, in/PDF, nút nhắc đóng.
- **Teacher comments (#015)**: nhận xét học sinh, lưu DB.
- **Enrollment requests**: duyệt ghi danh.
- **Notifications (#5)**: bảng + trigger tự sinh (#017).
- **Reports / Users / Subjects / Parent & Student portal**: đã có section.
- **Settings**: đổi tên, đổi ngôn ngữ (vi/en), đổi mật khẩu (#7a).
- **#7a Đổi MK trong Settings**: chạy được KHI vào app qua `/dashboard` (đã có Supabase session).

## Đang làm
- **#7b Quên MK qua email**: CODE ĐÃ SỬA, chờ config Supabase + test end-to-end.
  - Đã sửa: `login/page.tsx` redirectTo → `/auth/callback?next=/reset-password`;
    `reset-password/page.tsx` nghe `PASSWORD_RECOVERY` + khoá nút đến khi xác thực xong.
  - Còn lại: làm config Supabase bên dưới rồi test.
- **Chuẩn hoá badge thông báo**: chuyển `buildNotifications` từ tính client-side sang đọc thẳng bảng `notifications`.

## Việc thủ công cần làm (Supabase / deploy)
- [ ] Auth → URL Configuration: Redirect URLs có `https://studyweb-swart.vercel.app/**`;
      **Site URL** đúng domain prod (đây là nơi bị đá về khi redirect sai — lý do reset MK "không thấy lỗi gì").
- [ ] Kiểm tra email recovery/confirm có về không (cả Spam); SMTP mặc định Supabase bị giới hạn rate.
- [ ] Chạy migration `017_notifications.sql`.
- [ ] Sau khi push: chờ Vercel build xong rồi test lại reset password.

---

## GỢI Ý: làm web thân thiện hơn cho người mới

Sắp theo mức ưu tiên. P0 = rào cản lớn nhất khiến người mới bỏ cuộc.

### P0 — Rào cản chặn người mới ngay từ đầu ✅ ĐÃ LÀM
- [x] **Xử lý trạng thái `Pending` cho tài khoản mới.**
      `dashboard/page.tsx` giờ kiểm tra role; nếu `Pending` → render `dashboard/pending.tsx`
      (màn "Tài khoản đang chờ duyệt": nêu email, bước tiếp theo, nút "Kiểm tra lại" + "Đăng xuất")
      thay vì đẩy vào app trống.
- [x] **Landing page thật ở `/`.**
      `app/page.tsx` viết lại thành trang giới thiệu (hero + 6 tính năng + 3 bước bắt đầu), có nút
      Đăng nhập/Đăng ký. Người đã đăng nhập vẫn redirect thẳng `/dashboard`.
- [x] **Thống nhất ngôn ngữ.**
      Việt hoá toàn bộ trang login + signup. Thêm `lib/auth-messages.ts` (`viError`) gói lỗi
      Supabase thô thành câu tiếng Việt dễ hiểu.
- [x] **Nói rõ "chuyện gì xảy ra tiếp theo" sau khi đăng ký.**
      Màn success của signup nêu 2 bước: xác nhận email → chờ admin cấp quyền.

  > Lưu ý: nội dung bên trong `tutor-hub-app.html` vẫn còn vài chuỗi tiếng Anh lẻ (P1).

### P1 — Giúp người mới biết phải làm gì trong app
- [ ] **Empty state có hướng dẫn** cho mọi section (Students, Classes, Assignments…).
      Thay vì bảng trống, hiện: "Chưa có học sinh nào — Nhấn + để thêm học sinh đầu tiên" kèm nút hành động.
- [ ] **Tour/onboarding lần đầu đăng nhập**: 3–5 bước tooltip chỉ vào sidebar, nút Thêm, Settings.
      Có thể dùng thư viện nhẹ (driver.js/shepherd) hoặc modal welcome đơn giản.
- [ ] **Checklist "Bắt đầu nhanh"** trên Dashboard cho tài khoản mới (VD giáo viên: tạo lớp →
      thêm học sinh → giao bài → xong), tự ẩn khi hoàn thành.
- [ ] **Nút "Xem thử dữ liệu mẫu"**: seed vài học sinh/lớp/bài mẫu để người mới nghịch, kèm nút xoá sạch.

### P2 — Đánh bóng trải nghiệm
- [ ] **Tooltip/help icon** cạnh các thuật ngữ (enrollment request, flashcard deck…).
- [ ] **Trang Help/FAQ** trong app + link "Cần trợ giúp?".
- [ ] **Thông báo lỗi thân thiện**: gói lỗi Supabase (VD "duplicate key", RLS 401) thành câu người thường hiểu.
- [ ] **Kiểm tra responsive/mobile** cho các bảng lớn (Students, Payments) — dễ vỡ layout trên điện thoại.
- [ ] **Loading skeleton** thay vì bảng trống chớp nháy khi đang tải DB.
- [ ] **Xác nhận trước khi xoá** (học sinh, lớp, bài) để người mới đỡ lỡ tay.
- [ ] **Accessibility cơ bản**: nhãn cho input, focus rõ ràng, tương phản màu ở dark mode.

---

## Cách test luồng quên mật khẩu (sau khi làm xong config)
1. `/login` → "Quên mật khẩu" → nhập email → nhận link trong hộp thư.
2. Bấm link → qua `/auth/callback` → tới `/reset-password` (nút hiện "Cập nhật mật khẩu").
3. Nhập MK mới → báo thành công → tự về `/login` → đăng nhập bằng MK mới.

## Lưu ý khi làm việc
- Không chạy song song nhiều agent/phiên Claude Code trên cùng repo này — dễ ghi đè lẫn nhau.
- Trước khi bắt đầu phiên mới: đọc file này trước, không cần kể lại từ đầu.

## Schema / quyết định kỹ thuật
- Đăng nhập THẬT chỉ ở trang Next.js `/login` (Supabase Auth). Form login TRONG
  `tutor-hub-app.html` (`tryLogin`/`quickLogin`) là MOCK — không tạo session Supabase, nên
  "Đổi mật khẩu" chỉ hoạt động khi vào qua `/dashboard`.
- Luồng quên MK dùng PKCE: `resetPasswordForEmail` → `/auth/callback?next=/reset-password`
  (route server `exchangeCodeForSession`) → `/reset-password` (đã có session) → `updateUser({ password })`.
- Role mới đăng ký = `Pending` (trigger DB `handle_new_user` + `enforce_admin_email` là nguồn sự thật);
  admin nâng quyền ở User Management.
- RLS bật trên hầu hết bảng, policy theo `user_id` / role.
- Bảng `notifications`: id, user_id (FK auth.users), icon, message, is_read, created_at.
