# Tutor Hub — Progress

> App quản lý trung tâm gia sư. Live: https://studyweb-swart.vercel.app

## Kiến trúc tổng quan
- **Next.js** (`tutor-hub-next/`) lo phần auth thật + khung ngoài:
  - `/login`, `/signup`, `/reset-password`, `/auth/callback` (OAuth + PKCE), middleware bảo vệ route.
  - `/dashboard` render **iframe** trỏ tới `public/tutor-hub-app.html`, truyền session (access/refresh token) xuống qua `postMessage`.
- **tutor-hub-app.html** = HTML khung + CSS (~4000 dòng). Toàn bộ JS đã tách thành
  **25 module trong `public/js/01-*.js … 25-*.js`**, nạp bằng `<script src>` classic theo
  đúng thứ tự (xem "Schema / quyết định kỹ thuật"). Nhận session rồi gọi thẳng Supabase.
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

### P1 — Giúp người mới biết phải làm gì trong app ✅ ĐÃ LÀM
- [x] **Empty state có hướng dẫn** — Students giờ phân biệt "Chưa có học sinh nào" (icon + nút
      "＋ Thêm học sinh đầu tiên") với "không khớp bộ lọc". Helper `_studentsEmptyRow()` trong
      `tutor-hub-app.html`. (Classes/Assignments có thể áp dụng cùng pattern sau — xem "Làm tiếp".)
- [x] **Welcome modal lần đầu đăng nhập** — `maybeShowWelcome()` hiện 1 lần (cờ `th_welcome_seen`),
      gợi ý theo role, trỏ tới nút ❓.
- [x] **Checklist "Bắt đầu nhanh"** trên Dashboard cho GV/Admin — `renderOnboardChecklist()`:
      tạo lớp → thêm học sinh → giao bài → tải tài liệu, có thanh tiến độ, tự ẩn khi xong hoặc bấm "Bỏ qua".
- [ ] **Nút "Xem thử dữ liệu mẫu"** (seed) — CHƯA làm, chuyển sang "Làm tiếp".

### P2 — Đánh bóng trải nghiệm ✅ PHẦN LỚN ĐÃ LÀM
- [x] **Trang Help/FAQ** — nút ❓ trên thanh trên → `openHelp()` mở modal FAQ (5 câu hỏi thường gặp).
- [x] **Thông báo lỗi thân thiện** — `lib/auth-messages.ts` cho luồng auth (đã làm ở P0).
- [x] **Xác nhận trước khi xoá** — đã có sẵn `confirm()` cho mọi thao tác xoá; Việt hoá 4 hộp thoại
      còn tiếng Anh (học sinh, lớp, BTVN, buổi học) + nhãn quick-action của Student/Parent.
- [ ] **Tooltip/help icon** cạnh thuật ngữ (enrollment request, flashcard deck…) — CHƯA, để "Làm tiếp".
- [ ] **Kiểm tra responsive/mobile** cho bảng lớn (Students, Payments) — CHƯA, để "Làm tiếp".
- [ ] **Loading skeleton** thay bảng trống chớp nháy khi tải DB — CHƯA, để "Làm tiếp".
- [ ] **Accessibility cơ bản** (nhãn input, focus, tương phản dark mode) — CHƯA, để "Làm tiếp".

---

## Mượt hơn & mobile ✅ ĐÃ LÀM (đợt gần nhất)
- [x] **Upload có phản hồi** — overlay "đang xử lý" dùng chung (`showBusy`/`hideBusy`, timeout
      an toàn 30s) wire vào `saveMaterial` + `submitWork`. Trước đây upload không có phản hồi,
      dễ double-submit và tưởng treo. (`saveAssignment` vốn đã có nút "Đang lưu…".)
- [x] **Tối ưu mobile** — @media ≤640px: ẩn lang-switch/Edit Mode khỏi topbar chật, bảng cuộn
      ngang mượt (`min-width` + `-webkit-overflow-scrolling`), vùng chạm lớn hơn, input 16px
      chống zoom nhảy iOS, quick-actions 2 cột. (Drawer sidebar + overlay đã có sẵn từ trước.)

## Giao diện — login + landing sáng/glass ✅ ĐÃ LÀM
- [x] **Login** build lại theo phong cách sáng (Ebolt): nền gradient sky/lavender + thẻ
      liquid-glass, logo SVG mũ tốt nghiệp, nút hiện/ẩn MK, thẻ nổi trang trí, tông giáo dục.
- [x] **Landing** tông sáng: hero heading gradient + thẻ nổi thống kê + mini-dashboard glass;
      feature card dùng **icon SVG** (đã bỏ emoji ở landing).
- [x] **Glass tối ưu mọi máy**: `.glass`/`.bright-bg`/`.floaty`/`.field` trong globals.css —
      backdrop-filter CHỈ ở vài thẻ nhỏ tĩnh + `@supports` fallback nền đặc; nền lớn = gradient
      (không blur); float chip = transform + guard reduced-motion; chip ẩn <900px.
- [ ] **Áp cùng phong cách cho signup + reset-password** (2 trang này vẫn nền tối cũ → lệch tông).

## Giao diện ✅ ĐÃ LÀM (theme giống tham chiếu Hireism)
- [x] **Font** Segoe UI → **Be Vietnam Pro** (dấu tiếng Việt đẹp, bớt generic/AI).
- [x] **Sidebar trắng** + item active pill indigo + thanh accent trái; nền **lavender**;
      primary **indigo #4f46e5**; radius 16; shadow mềm. Token hoá `--nav-active-*`, `--brand-grad`
      để đồng bộ light/dark. Đã test 2 chế độ, 0 lỗi console.
- [x] **Font thống nhất toàn app** — `next/font` tự host Be Vietnam Pro trong `layout.tsx`
      (subset vi, swap) → login/signup/reset/landing/dashboard đều dùng chung; gỡ hết `Segoe UI`.
- [x] **Tối ưu máy yếu** — thêm `@media prefers-reduced-motion` (globals.css + app iframe),
      bỏ `backdrop-filter blur` ở modal overlay. Chủ ý KHÔNG dùng glassmorphism/blur như
      ảnh tham chiếu 2-4 (hại GPU máy yếu); giữ hướng phẳng/sạch.
- [ ] **Thay emoji icon → bộ SVG (Lucide)** ở sidebar/nav/nút. Đây là "AI tell" còn lại lớn nhất;
      skill ui-ux-pro-max cấm emoji làm icon. Việc vừa, nên làm để giống tham chiếu 100%.

## Làm tiếp để web tốt hơn (đề xuất, theo giá trị/công sức)

### Trải nghiệm người mới (nối tiếp P1/P2)
- [ ] **Áp empty-state có hướng dẫn cho Classes, Assignments, Materials, Flashcards** (đã có mẫu
      `_studentsEmptyRow`, chỉ cần nhân bản pattern).
- [ ] **Dữ liệu mẫu 1 chạm**: nút "Nạp dữ liệu mẫu" + "Xoá dữ liệu mẫu" để người mới nghịch thử.
- [ ] **Tooltip giải thích thuật ngữ** (enrollment request, deck, submission…).
- [ ] **Loading skeleton** cho các bảng khi `loadDbData()` chưa xong.

### Chất lượng & độ tin cậy
- [x] **Tách `tutor-hub-app.html` thành 25 module** (`public/js/`) — Cách A (classic script,
      giữ global scope). HTML còn ~4000 dòng. Đã test app nạp không lỗi + build pass.
      Nhân tiện lộ ra & cần dọn: 2 hàm `deleteMaterial` trùng tên (giờ ở `02-db-api.js` dòng
      ~4 và `24-materials.js` — bản trong 02 là code chết, bị đè).
- [ ] **Kiểm thử tự động**: thêm test cho luồng auth + vài hàm thuần (avgScore, getGrade…).
- [ ] **Thay `confirm()`/`alert()` native** bằng modal xác nhận trong app cho đồng nhất giao diện.
- [ ] **Error boundary + trạng thái rỗng khi RLS/500** thay vì bảng trắng im lặng.

### Di động & khả năng tiếp cận
- [x] **Responsive cho bảng lớn** — đã cho cuộn ngang mượt trên mobile (đợt gần nhất).
- [ ] **Dạng thẻ thay bảng trên mobile** cho Students/Payments (cuộn ngang tạm ổn, thẻ sẽ đẹp hơn).
- [ ] **A11y**: `aria-label` cho nút icon (❓🔔🌙), bẫy focus trong modal, kiểm tra tương phản dark mode.

### Tính năng nâng cao (khi cần)
- [ ] **Thông báo realtime** (Supabase Realtime) thay vì phải bấm 🔔 tải lại.
- [ ] **Xuất báo cáo** (điểm/điểm danh/học phí) ra Excel/PDF.
- [ ] **Nhắc học phí/BTVN qua email** tự động.
- [ ] **Nhật ký hoạt động (audit log)** cho thao tác của admin.

---

## Cách test luồng quên mật khẩu (sau khi làm xong config)
1. `/login` → "Quên mật khẩu" → nhập email → nhận link trong hộp thư.
2. Bấm link → qua `/auth/callback` → tới `/reset-password` (nút hiện "Cập nhật mật khẩu").
3. Nhập MK mới → báo thành công → tự về `/login` → đăng nhập bằng MK mới.

## Lưu ý khi làm việc
- Không chạy song song nhiều agent/phiên Claude Code trên cùng repo này — dễ ghi đè lẫn nhau.
- Trước khi bắt đầu phiên mới: đọc file này trước, không cần kể lại từ đầu.

## Schema / quyết định kỹ thuật
- **Cấu trúc JS module (QUAN TRỌNG)**: JS của app nằm ở `public/js/01-*.js … 25-*.js`,
  nạp bằng `<script src>` **classic (KHÔNG `type="module"`)** theo đúng thứ tự đánh số.
  Lý do: ~300 hàm gọi qua `onclick="fn()"` viết trong chuỗi HTML → cần global scope.
  - **Thứ tự nạp là bắt buộc**: `01-core-state` (biến state) phải trước; đừng đảo thứ tự.
  - Hoisting KHÔNG xuyên file: code chạy ở top-level không được gọi hàm ở file nạp SAU.
    (Vì vậy khối khôi phục cỡ chữ/dark mode đã dời xuống `25-init.js`.)
  - **`proxy.ts` phải loại trừ `js/`** khỏi middleware auth; nếu không, mỗi `<script src>`
    bị redirect sang `/login` → app trắng/thiếu hàm. Đừng bỏ mục `js/` trong matcher.
- **Iframe init (QUAN TRỌNG)**: `dashboard/page.tsx` gửi `TUTOR_HUB_INIT` qua sự kiện
  `onLoad` của iframe, KHÔNG đọc `contentDocument.readyState`. Iframe render có điều kiện
  (chỉ khi role hợp lệ) nên lúc vừa mount readyState='complete' là của `about:blank` —
  nếu post lúc đó message rơi vào trang blank và mất → app hiện MÀN TRẮNG. Đừng đổi lại.
- Middleware coi `/` là route công khai (landing page hiện cho người chưa đăng nhập);
  người đã đăng nhập vào `/` sẽ được `app/page.tsx` chuyển tới `/dashboard`.
- Đăng nhập THẬT chỉ ở trang Next.js `/login` (Supabase Auth). Form login TRONG
  `tutor-hub-app.html` (`tryLogin`/`quickLogin`) là MOCK — không tạo session Supabase, nên
  "Đổi mật khẩu" chỉ hoạt động khi vào qua `/dashboard`.
- Luồng quên MK dùng PKCE: `resetPasswordForEmail` → `/auth/callback?next=/reset-password`
  (route server `exchangeCodeForSession`) → `/reset-password` (đã có session) → `updateUser({ password })`.
- Role mới đăng ký = `Pending` (trigger DB `handle_new_user` + `enforce_admin_email` là nguồn sự thật);
  admin nâng quyền ở User Management.
- RLS bật trên hầu hết bảng, policy theo `user_id` / role.
- Bảng `notifications`: id, user_id (FK auth.users), icon, message, is_read, created_at.
