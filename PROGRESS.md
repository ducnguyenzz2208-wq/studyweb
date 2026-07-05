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
- [ ] Chạy migration `018_find_account_by_name.sql` (bật tra cứu học sinh theo TÊN; nếu chưa chạy,
      tra theo email vẫn hoạt động, tra theo tên sẽ báo lỗi nhắc chạy migration).
- [ ] Chạy migration `019_realtime_notifications.sql` — bật Supabase Realtime cho `notifications`
      (không có bước này thì 🔔 vẫn cần bấm tải lại; app không lỗi).
- [ ] Chạy migration `020_audit_log.sql` — bảng nhật ký + `log_audit()`. Chưa chạy: nút "Nhật ký"
      báo lỗi khi mở, các thao tác vẫn chạy bình thường (ghi log là best-effort, không chặn).
- [ ] Chạy migration `021_reminders.sql` — RPC nhắc học phí/bài tập. Chưa chạy: nút "Nhắc…" báo lỗi
      RPC; mọi thứ khác không ảnh hưởng. (Tuỳ chọn: bật pg_cron theo comment trong file để tự động.)
- [ ] **Chạy migration `022_secure_notifications_insert.sql`** (BẢO MẬT — nên chạy sớm): siết RLS
      INSERT của `notifications` + RPC `send_payment_reminder`. Chưa chạy: học sinh vẫn có thể spam/giả
      mạo thông báo, VÀ nút "🔔 Nhắc đóng" (từng khoản) sẽ báo lỗi RPC. Chạy SAU `017` và `021`.
- [ ] **Chạy migration `023_fix_signup_trigger.sql`** (GẤP — đang chặn đăng ký): sửa lỗi
      "Database error saving new user" (500) khi tạo tài khoản. Sau khi chạy, đăng ký được ngay.
- [ ] **Chạy migration `024_admin_list_all_users.sql`** (GẤP — admin không thấy tài khoản chờ duyệt):
      RPC `admin_list_users()` (thấy cả user chưa có profile) + `admin_set_role()` (duyệt = tạo profile).
      Chưa chạy: app tự fallback đọc bảng profiles (chỉ thấy user ĐÃ có profile).
- [ ] Sau khi push: chờ Vercel build xong rồi test lại reset password.

## Ổn định cho người dùng THẬT (roadmap — làm tiếp)
> Mục tiêu: đủ tin cậy cho học sinh + giáo viên thật dùng. Trọng tâm là BỊT CHỖ DỄ VỠ,
> không phải thêm tính năng. Sắp theo mức ưu tiên.

### P0 — Đang chặn người dùng thật (cấu hình + lỗ hổng, phần lớn KHÔNG cần code)
- [ ] **Chạy hết migration + Auth URL config** (xem mục "Việc thủ công" ở trên): `017`→`021` +
      Site URL/Redirect URLs đúng domain prod. Thiếu → reset MK hỏng, không có realtime, nút Nhắc/Nhật ký lỗi.
- [ ] **Email deliverability**: cắm **Custom SMTP** (Resend/SendGrid free) trong Auth → SMTP. SMTP mặc
      định Supabase giới hạn rate → đăng ký đông thì email xác nhận rớt âm thầm. (Tuỳ chọn: tạm tắt
      "Confirm email" lúc đầu để giảm ma sát, bật lại khi có SMTP.)
- [x] **Bịt lỗ hổng chèn notifications** ✅ CODE XONG (cần chạy migration `022`): migration
      `022_secure_notifications_insert.sql` bỏ policy INSERT rộng + thêm RPC `send_payment_reminder`
      (SECURITY DEFINER, chỉ Admin, dựng message server-side). Client `sendPaymentReminder`
      (19-payments.js) đã chuyển từ `.from('notifications').insert` sang `_db.rpc(...)`. Đã rà: KHÔNG
      còn chỗ client nào insert trực tiếp vào notifications (mọi thông báo qua trigger #017 / RPC #021,#022).
      ⚠️ Nếu chạy lại `017` sau này (nó tạo lại policy rộng) thì phải chạy lại `022`.

### P1 — Độ tin cậy khi dùng lâu (cần code)
- [ ] **Token iframe hết hạn giữa phiên**: access token nhận qua `postMessage` hết hạn ~1h → query
      401 âm thầm, bảng trống dần. Bắt lỗi 401 → tự `refreshSession()` hoặc hiện "Phiên hết hạn, đăng
      nhập lại". Đây là nguyên nhân điển hình "dùng một lúc thì tự hỏng".
- [ ] **Dứt điểm ranh giới demo ↔ DB thật** (memory `demo-to-db-pattern`): vài mục còn lưu local-only
      → bấm lưu tưởng xong, reload mất → mất niềm tin. Hoặc DB-hoá nốt, hoặc ẩn/khoá nút lưu ở mục chưa nối DB.
- [ ] **Error/empty/loading states cho MỌI mục DB**: mới có ở Students/Materials/Payments. Nhân rộng
      `errorBlock()`/`retryLoad()`/skeleton sang Schedule, Attendance, Assignments, Flashcards (tránh bảng trắng im lặng khi RLS/500).

### P2 — Hạ tầng vận hành
- [ ] **Error monitoring**: `window.onerror` → log (hoặc Sentry free) để BIẾT người dùng gặp lỗi gì.
- [ ] **Smoke test e2e thật** (Playwright): login → dashboard → thêm học sinh → giao bài. (Unit test
      hiện chỉ phủ helper thuần + viError.)
- [ ] **Backup dữ liệu** Supabase (PITR/định kỳ) trước khi có dữ liệu thật của học sinh.

### Nghiệm thu nhanh (chạy với tài khoản thật, mọi vai trò)
> Code đã sẵn sàng; các bước cần MÔI TRƯỜNG THẬT của bạn (chạy migration `023`, cấu hình SMTP,
> tài khoản admin) — chạy theo runbook dưới. Trạng thái: ✅ code-verified / ⏳ chờ bạn thao tác.
- [x] **Lỗi "Database error saving new user" khi đăng ký** — ĐÃ FIX (migration `023_fix_signup_trigger.sql`:
      `handle_new_user()` bọc EXCEPTION nên không bao giờ 500; + `dashboard/page.tsx` tạo profile bù
      nếu thiếu). ⏳ Cần chạy `023` trên prod rồi thử đăng ký lại.
- [x] **Admin không thấy tài khoản chờ duyệt trong "Quản lý người dùng"** — ĐÃ FIX. Nguyên nhân: mục
      này đọc bảng `profiles`; tài khoản mà trigger tạo profile lỗi → có trong `auth.users` nhưng thiếu
      profile → vô hình với admin. Fix: migration `024` (RPC `admin_list_users` join `auth.users` → thấy
      cả user chưa có profile; `admin_set_role` duyệt = tạo profile) + client `loadUsersFromDb`/
      `changeUserRole` gọi RPC (fallback đọc profiles nếu chưa chạy 024). ⏳ Cần chạy `024`.
- [ ] ⏳ Đăng ký mới → email xác nhận → đăng nhập → màn "chờ duyệt". (cần chạy `023` + SMTP; màn
      pending + gate Pending đã có sẵn trong `dashboard/page.tsx`.)
- [ ] ⏳ Admin cấp quyền → học sinh reload thấy đúng cổng. (code: `changeUserRole` + RLS "Admin updates
      any profile" + dashboard đọc role tươi mỗi lần vào — ✅ đường đi đúng, cần test với tài khoản thật.)
- [ ] ⏳ Reset mật khẩu end-to-end. (code #7b đã xong; cần SMTP + Site URL/Redirect đúng.)
- [ ] ⏳ Học sinh A KHÔNG thấy dữ liệu học sinh B. (RLS `students`: "Students read own record" theo email
      — ✅ chính sách đúng; cần kiểm thực tế với 2 tài khoản HS.)
- [ ] ⏳ GV tạo lớp/giao bài → HS trong lớp thấy bài. (code: assignments RLS cho Student đọc + feed lọc
      theo `class_members`; cần thêm HS vào lớp bằng email rồi kiểm.)

## Fix lỗi (đợt gần nhất)
- [x] **Flashcard bulk-import không lưu** (400 `invalid uuid: "6"`): `bulkImport` gọi `persistDeck`
      cũ (upsert **id số** vào cột `uuid`). Đã sửa: chèn thẳng vào `flashcards` với `deck_id=dbId`
      (giống `saveCard`), gán `dbId` trả về. (Đúng gợi ý memory `demo-to-db-pattern`: qid/UUID.)
      `persistDeck` giờ là code chết — nên xoá sau.
- [x] **Add Student**: ô tra cứu nhận email/tên → điền cả tên & email; **bỏ 2 ô điểm số**
      (đồng bộ tự động từ Bài tập); `saveStudent` giữ điểm cũ khi sửa, 0 khi thêm.
- [x] **Dark mode mất icon topbar** (chuông/theme/trợ giúp): `.theme-btn`/`.notif-btn` không set
      `color`; sau khi đổi emoji→SVG (`stroke=currentColor`) icon bị tối trên nền tối. Thêm
      `color: var(--text)` → bám theme. Đã test light+dark (icon = #e2e8f0 dark / #1e2437 light).

## Nhạc đa nền tảng: YouTube + Spotify + SoundCloud ✅ ĐÃ LÀM
- [x] **Nhận link Spotify & SoundCloud** ngoài YouTube (26-pomodoro.js): `_parseMusicUrl()` nhận diện
      nguồn (YouTube/Spotify/SoundCloud, kể cả link `intl-*` của Spotify), track lưu thêm `provider`/`ref`/`url`.
      YouTube giữ IFrame API (điều khiển đầy đủ + tự chuyển bài); Spotify/SoundCloud dùng **khung nhúng
      chính thức** (`open.spotify.com/embed`, `w.soundcloud.com/player`) — phát ngay trong khung + nút
      chuyển bài trong hàng chờ. oEmbed lấy tiêu đề/ảnh theo từng nguồn (fallback tên nguồn). Hàng chờ
      có badge nguồn (YouTube/Spotify/SoundCloud) + ảnh/placeholder. Tương thích ngược track cũ (chỉ có videoId).
- [x] **CSP** (`next.config.ts`): thêm `open.spotify.com`, `w.soundcloud.com` vào `frame-src`;
      `open.spotify.com`, `soundcloud.com` vào `connect-src` (oEmbed). ⚠️ Cần Vercel redeploy.
- **Verify**: parser đúng cả 3 nguồn (+intl Spotify, loại link sai), embed src đúng, iframe render
      152px (Spotify) không lỗi CSP, badge hàng chờ hiện đúng; build pass. Lưu ý: Spotify chỉ phát đầy
      đủ khi trình duyệt đang đăng nhập Spotify Premium (nếu không chỉ 30s preview — giới hạn của Spotify).

---

## Fix nhạc YouTube (CSP) + Lịch → Google Calendar ✅ ĐÃ LÀM
- [x] **Fix nhạc YouTube bị chặn**: CSP trong `next.config.ts` chỉ cho Supabase/jsdelivr → chặn
      `youtube.com/iframe_api`, oEmbed và khung nhúng. Đã thêm youtube vào `script-src`
      (`www.youtube.com` + `s.ytimg.com`), `connect-src` (`www.youtube.com`), và thêm directive
      `frame-src` (`www.youtube.com` + `www.youtube-nocookie.com`). Verify: header đã có youtube,
      IFrame API nạp được, player iframe tạo ra, 0 lỗi CSP. ⚠️ **Cần Vercel redeploy** (tự động khi push).
- [x] **Lịch → Google Calendar (bản an toàn, KHÔNG cần OAuth)** (08-schedule.js):
      `addToGoogleCalendar(id)` mở link `calendar.google.com/render` (1 chạm thêm 1 buổi) — nút trong
      modal buổi học; `exportScheduleICS()` xuất `.ics` (iCalendar) toàn bộ lịch của người dùng để
      nhập vào Google/Apple/Outlook — nút "📅 Xuất Google Calendar" ở header Lịch. Parse giờ 12h/24h,
      `.ics` chuẩn VEVENT (verify DTSTART/DTEND đúng). Đồng bộ 2 chiều thật cần OAuth → để "làm tiếp".

---

## Mục Pomodoro / Study tools ✅ ĐÃ LÀM (port từ my-clone)
Port 5 tính năng từ `my-clone/` (repo `ai-website-clone-template` — React/Next) sang Tutor Hub,
viết LẠI theo kiến trúc classic-JS (KHÔNG copy React). Mục MỚI **Pomodoro** cho GV + HS.
- **Module mới** `public/js/26-pomodoro.js` (nạp trước `25-init.js`); section `#section-pomodoro`
  trong `tutor-hub-app.html`; CSS Pomodoro + token `--streak-1..4`.
- **Pomodoro timer**: đếm ngược drift-resistant (dựa `phaseEndAt` wall-clock), chu kỳ tập trung/
  nghỉ ngắn/nghỉ dài, cài đặt thời lượng, tự cộng phút tập trung vào nhật ký, **chạy nền** (đổi mục
  vẫn đếm) + tiếp tục sau reload. Ring SVG + chuông báo hết phiên.
- **Focus Lock**: toàn màn hình + cảnh báo khi rời tab/thoát fullscreen. Thêm `allow="fullscreen"`
  cho iframe ở `app/dashboard/page.tsx` (degrade an toàn nếu bị chặn).
- **Ghi chú nhanh**: tối đa 8 sticky note màu, hoàn thành/xoá, sửa inline.
- **Nhạc học tập (YouTube)**: dán link → hàng chờ (tiêu đề/thumbnail qua oEmbed), phát/tạm dừng/
  chuyển bài/âm lượng qua YouTube IFrame API, tự chuyển bài khi hết.
- **Chuỗi tập trung**: lịch tháng heatmap 5 mức (ngưỡng ≤1.5h/2.5h/4.5h), tooltip số giờ chính xác.
- **Phân quyền**: thêm `pomodoro` vào `ROLE_SECTIONS` (Teacher/Admin/Student) + nav + i18n + tooltip.
- Lưu localStorage (`th_pomo_*`, `th_focus_log`, `th_notes`, `th_music_*`) — không cần backend.
- **Verify**: mock-login HS+GV → section render đủ 5 phần, timer chạy/dừng, note thêm được, heatmap
  tô màu theo phút (lvl3 cho 200'), parser link YT đúng mọi định dạng, 0 lỗi console; build+test pass.

---

## Đợt patch 2 (Realtime / Export / Reminders / Audit / A11y) ✅ ĐÃ LÀM
Patch tiếp trên app hiện có, diff nhỏ + an toàn, giữ route/auth/RLS/data-flow, song ngữ.
- [x] **Realtime notifications** — client đã có; migration `019_realtime_notifications.sql` bật
      publication + `REPLICA IDENTITY FULL`. Subscribe đổi `event:'INSERT'`→`'*'` (đồng bộ đã đọc/xoá).
- [x] **Export báo cáo** (09-reports-comments.js) — `exportGradesCSV`/`exportAttendanceCSV`/
      `exportPaymentsCSV` (CSV BOM UTF-8) + `exportReportPDF` (in) + `openExportMenu()`. Nút cũ
      (toast giả) → mở menu thật. Học phí CSV chỉ admin.
- [x] **Reminders** — `remindAllUnpaid()` (Payments, admin) + `remindPendingHomework()` (Assignments,
      GV/Admin) gọi RPC `021_reminders.sql`. Nút `payRemindBtn`/`hwRemindBtn` ẩn/hiện theo vai trò.
- [x] **Audit log** — `020_audit_log.sql` (bảng + `log_audit()` + RLS admin-read). `logAudit()`
      (02-db-api.js) wire vào: đổi vai trò, phân lớp, tạo/đánh dấu học phí, nạp/xoá mẫu, nhắc, xuất.
      Viewer `openAuditLog()` (11-user-management.js) + nút "Nhật ký" (admin) ở Quản lý ND.
- [x] **A11y thêm** — charts mục Báo cáo dùng màu theo theme (`getChartTextColor`/`getChartGridColor`
      + đăng ký trong `refreshCharts`) → hết chữ mờ trên nền tối; `openModal` tự gắn `<label for>`
      với ô nhập trong `.form-group`; toast container `role="status" aria-live="polite"`.
- **Verify**: mock-login admin trong preview → menu xuất 4 mục, CSV escape đúng (BOM + bọc "),
      nút nhắc/nhật ký hiện đúng vai trò, label-modal liên kết, 0 lỗi console; charts dark rõ chữ.
- **Migration cần chạy tay** (Supabase SQL Editor): `019`, `020`, `021` (xem mục dưới).

---

## Đợt patch UX (production-grade, KHÔNG rebuild) ✅ ĐÃ LÀM
Patch trên app hiện có, diff nhỏ + an toàn, giữ nguyên route/auth/data-flow, song ngữ.
- [x] **Tooltip thuật ngữ** — `GLOSSARY` (vi/en) + `helpTip()`/`injectHelpTips()` + icon `info`/
      `alert-triangle` trong `SVG_ICONS`. Placeholder `data-help` ở tiêu đề Students/Classes/
      Flashcards/Payments/Assignments; re-render theo `showSection` + `setLang` (đổi ngôn ngữ).
- [x] **Bảng → thẻ trên mobile** — `.stack-table` + `data-label` (Students, Payments). Đã test 375px:
      `<thead>` ẩn, mỗi hàng 1 thẻ, nhãn cột qua `::before`. Skeleton cũng thêm cho Payments.
- [x] **A11y** — `:focus-visible`, `aria-label` ô lọc/tìm, tương phản dark `--text-muted` cao hơn.
- [x] **Dữ liệu mẫu 1 chạm** — `loadSampleData()`/`clearSampleData()` (02-db-api.js), theo dõi id
      qua `localStorage` (`th_sample_ids`). Nút ở Cài đặt (GV/Admin) + link trong checklist.
- [x] **`uiConfirm()`** thay 12 chỗ `confirm()` native (không còn native confirm/alert).
- [x] **Trạng thái lỗi** — Next `app/error.tsx` + `app/dashboard/error.tsx`; trong app `_dbError`
      theo section + `errorBlock()` + `retryLoad()`, wire vào loader Students/Materials/Payments.
- [x] **Test tự động (Vitest)** — 19 test pass (`npm test`): viError (auth) + getGrade/avgScore
      (trích từ mã thật, không nhân bản). Build Next + `node --check` mọi module JS: pass.
- **Verify**: mock-login trong preview → Students render thẻ + tooltip + uiConfirm mở/đóng đúng,
      0 lỗi console. (App thật vào qua `/dashboard` cần Supabase session như cũ.)

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
- [x] **Nút "Xem thử dữ liệu mẫu"** (seed) — ĐÃ LÀM: "Nạp/Xoá dữ liệu mẫu" (xem "Đợt patch UX").

### P2 — Đánh bóng trải nghiệm ✅ PHẦN LỚN ĐÃ LÀM
- [x] **Trang Help/FAQ** — nút ❓ trên thanh trên → `openHelp()` mở modal FAQ (5 câu hỏi thường gặp).
- [x] **Thông báo lỗi thân thiện** — `lib/auth-messages.ts` cho luồng auth (đã làm ở P0).
- [x] **Xác nhận trước khi xoá** — đã có sẵn `confirm()` cho mọi thao tác xoá; Việt hoá 4 hộp thoại
      còn tiếng Anh (học sinh, lớp, BTVN, buổi học) + nhãn quick-action của Student/Parent.
- [x] **Tooltip/help icon** cạnh thuật ngữ (enrollment request, deck, submission…) — ĐÃ LÀM (xem "Đợt patch UX").
- [x] **Kiểm tra responsive/mobile** cho bảng lớn (Students, Payments) — ĐÃ LÀM (bảng → thẻ xếp dọc).
- [x] **Loading skeleton** thay bảng trống chớp nháy khi tải DB — ĐÃ LÀM (thêm cả Payments đợt này).
- [x] **Accessibility cơ bản** (nhãn input, focus, tương phản dark mode) — ĐÃ LÀM (đợt patch UX).

---

## Mượt hơn & mobile ✅ ĐÃ LÀM (đợt gần nhất)
- [x] **Upload có phản hồi** — overlay "đang xử lý" dùng chung (`showBusy`/`hideBusy`, timeout
      an toàn 30s) wire vào `saveMaterial` + `submitWork`. Trước đây upload không có phản hồi,
      dễ double-submit và tưởng treo. (`saveAssignment` vốn đã có nút "Đang lưu…".)
- [x] **Tối ưu mobile** — @media ≤640px: ẩn lang-switch/Edit Mode khỏi topbar chật, bảng cuộn
      ngang mượt (`min-width` + `-webkit-overflow-scrolling`), vùng chạm lớn hơn, input 16px
      chống zoom nhảy iOS, quick-actions 2 cột. (Drawer sidebar + overlay đã có sẵn từ trước.)

## Giao diện — Compact pass + Lịch tháng ✅ ĐÃ LÀM (tham chiếu Nexora)
- [x] **Compact UI**: `--sidebar-w` 240→216, `--radius` 16→14, `.content` 28→22, card/kpi 20→16,
      page-header nhẹ hơn (h2 24/800 → 21/700), nav-item gọn (8/12, 13.5px). Ít "template" hơn.
- [x] **Lịch THÁNG cho Schedule** (`08-schedule.js`): grid 6 tuần, đánh dấu ngày có buổi bằng
      pill (màu theo trạng thái), bấm ngày → panel buổi học bên phải (giờ/lớp/GV·phòng/chấm).
      Toggle **Tháng/Tuần**, nav ‹ hôm nay ›. Mobile: 1 cột, pill → chấm.
  - **Phân quyền** (yêu cầu): dùng `_schedItemsForUser()` — HV/PH chỉ lớp mình/con; GV/Admin buổi
    mình phụ trách (`loadSchedule` lọc `owner_id`). KHÔNG đổi backend/logic.
  - Sửa **lệch 1 ngày**: dùng `ymd()` (giờ địa phương) thay `toISOString()` (UTC) cho cả tuần lẫn tháng.
  - Việt hoá tiêu đề/tabs Lịch học.

## Giao diện — Profile panel + Settings ✅ ĐÃ LÀM (refine "real product")
- [x] **Profile panel**: header `--brand-grad` (bỏ navy cũ), avatar/badge gọn, activity-icon +
      lang-btn active dùng `--nav-active-bg`; nút "Sửa thông tin" emoji→SVG.
- [x] **Settings**: section header overline in hoa (đồng bộ sidebar/profile), mật độ chặt hơn,
      input trắng + focus ring indigo + read-only distinction (Vai trò/Email muted), màu nhấn
      indigo-led, Việt hoá toàn bộ nhãn còn lệch EN. UI-only, không đụng logic.

## Giao diện — login + landing sáng/glass ✅ ĐÃ LÀM
- [x] **Login** build lại theo phong cách sáng (Ebolt): nền gradient sky/lavender + thẻ
      liquid-glass, logo SVG mũ tốt nghiệp, nút hiện/ẩn MK, thẻ nổi trang trí, tông giáo dục.
- [x] **Landing** tông sáng: hero heading gradient + thẻ nổi thống kê + mini-dashboard glass;
      feature card dùng **icon SVG** (đã bỏ emoji ở landing).
- [x] **Glass tối ưu mọi máy**: `.glass`/`.bright-bg`/`.floaty`/`.field` trong globals.css —
      backdrop-filter CHỈ ở vài thẻ nhỏ tĩnh + `@supports` fallback nền đặc; nền lớn = gradient
      (không blur); float chip = transform + guard reduced-motion; chip ẩn <900px.
- [x] **signup + reset-password** đã build lại theo phong cách sáng/glass (đồng bộ login),
      bỏ emoji → icon SVG.
- [x] **Glass bên trong dashboard**: modal dùng liquid-glass (overlay tĩnh → rẻ) + `@supports`
      fallback nền đặc + `--modal-bg` theme-aware; welcome banner indigo + sheen; card inset highlight.
- [x] **Bỏ số liệu ảo ở landing**: preview còn 2 thẻ Giáo viên/Học sinh để TRỐNG (—) đến khi có
      dữ liệu thật; chip nổi bỏ số bịa. (Sau này nối số thật từ DB vào 2 thẻ này.)

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
- [x] **Thay emoji icon → bộ SVG (Lucide)** ✅ — bộ dùng chung `SVG_ICONS`/`svgIcon()` trong
      `05-navigation.js`. Đã áp: sidebar nav (17 mục), quick-actions (chip bo tròn indigo),
      topbar (hamburger/help/theme/notif) + `aria-label`, theme moon↔sun, modal Help, checklist.
      Còn sót emoji "nội dung" (không phải icon cấu trúc): 👋 welcome, icon activity-log lấy từ DB,
      nút demo offline — để sau, ưu tiên thấp.

## Làm tiếp để web tốt hơn (đề xuất, theo giá trị/công sức)

### Trải nghiệm người mới (nối tiếp P1/P2)
- [x] **Empty-state có hướng dẫn cho Classes, Materials, Flashcards (+ deck cards)** — helper
      `emptyBlock()` (05-navigation.js) + CSS `.empty-state`; icon SVG + tiêu đề VN + nút hành động
      cho GV/Admin; phân biệt chưa-có vs không-khớp-lọc. (Assignments vốn đã có gợi ý dạng chữ.)
- [x] **Dữ liệu mẫu 1 chạm**: nút "Nạp dữ liệu mẫu" + "Xoá dữ liệu mẫu" — chèn lớp/HS THẬT vào
      Supabase (owned by user, tuân RLS), lưu id đã chèn vào `localStorage` (`th_sample_ids`) để
      xoá đúng phần đã nạp. Đặt ở Cài đặt (chỉ GV/Admin) + link trong checklist "Bắt đầu nhanh".
- [x] **Tooltip giải thích thuật ngữ** (enrollment request, deck, submission, overdue, avg-score…) —
      `GLOSSARY` song ngữ + `helpTip()`/`injectHelpTips()` (05-navigation.js); icon ⓘ hover/focus.
- [x] **Loading skeleton** — flag `_dbLoading` + `skelTableRows()`/`skelCards()` + CSS `.skel`;
      guard trong render Students/Materials/Flashcards/Classes; tự tắt sau 1.4s. Đã test 4 section.

### Chất lượng & độ tin cậy
- [x] **Tách `tutor-hub-app.html` thành 25 module** (`public/js/`) — Cách A (classic script,
      giữ global scope). HTML còn ~4000 dòng. Đã test app nạp không lỗi + build pass.
      Nhân tiện lộ ra & cần dọn: 2 hàm `deleteMaterial` trùng tên (giờ ở `02-db-api.js` dòng
      ~4 và `24-materials.js` — bản trong 02 là code chết, bị đè).
- [x] **Kiểm thử tự động**: Vitest — `__tests__/auth-messages.test.ts` (viError) +
      `__tests__/helpers.test.ts` (trích getGrade/avgScore TỪ mã thật 12-ui-core.js, không nhân bản).
      `npm test` → 19 test pass. Thêm devDep `vitest`, script `test`/`test:watch`.
- [x] **Thay `confirm()` native** bằng `uiConfirm()` (12-ui-core.js) — modal song ngữ, bẫy focus/Esc,
      nút nguy hiểm đỏ. Đã đổi cả 12 chỗ gọi `confirm()` (không còn `confirm()`/`alert()` native).
- [x] **Error boundary + trạng thái lỗi khi RLS/500** — Next: `app/error.tsx` + `app/dashboard/error.tsx`.
      Trong app iframe: `_dbError` theo section + `errorBlock()` + nút "Thử lại" (`retryLoad()`),
      wire vào loader Students/Materials/Payments (thay bảng trắng im lặng).

### Di động & khả năng tiếp cận
- [x] **Responsive cho bảng lớn** — đã cho cuộn ngang mượt trên mobile (đợt gần nhất).
- [x] **Dạng thẻ thay bảng trên mobile** cho Students/Payments — class `.stack-table` + `data-label`
      trên từng `<td>`; ≤640px `<thead>` ẩn, mỗi hàng thành 1 thẻ, nhãn cột hiện qua `td::before`.
      Hàng nhóm lớp (`.group-row`) và hàng trạng thái (`.state-cell`) vẫn full-width.
- [x] **A11y (một phần)**: đã thêm `aria-label` cho nút icon topbar (help/theme/notif/hamburger).
- [x] **A11y modal**: `role="dialog"` + `aria-modal`, bẫy focus (Tab/Shift+Tab), Esc đóng,
      focus vào ô đầu + khôi phục focus cũ khi đóng (`openModal`/`closeModal` trong 12-ui-core).
- [x] **A11y (còn lại)**: bơm tương phản `--text-muted` dark (#8899aa→#9fb2c7, đạt ~AA trên card),
      `:focus-visible` viền rõ toàn cục, `aria-label` cho các ô tìm kiếm/lọc (Students/Materials/
      Payments/Attendance), `aria-hidden` cho icon 🔍 trang trí.

### Tính năng nâng cao (khi cần)
- [x] **Thông báo realtime** (Supabase Realtime) — client đã subscribe `postgres_changes` (giờ `event:'*'`
      để đồng bộ cả đã đọc/đã xoá); migration **019** thêm `notifications` vào publication
      `supabase_realtime` + `REPLICA IDENTITY FULL`. (Xem "Đợt patch 2".)
- [x] **Xuất báo cáo** (điểm/điểm danh/học phí) ra Excel/PDF — CSV có BOM UTF-8 (mở Excel, dấu VN)
      + In/PDF (cửa sổ in). Nút "Xuất báo cáo" ở mục Báo cáo → `openExportMenu()`.
- [x] **Nhắc học phí/BTVN** — bản an toàn: nút bấm gọi RPC server (migration **021**:
      `remind_overdue_payments`/`remind_pending_homework`, chống spam 6h). Tự động qua email/pg_cron
      để sau (đã ghi sẵn 2 dòng `cron.schedule` mẫu trong migration).
- [x] **Nhật ký hoạt động (audit log)** — migration **020** (`audit_logs` + `log_audit()` SECURITY
      DEFINER, chỉ Admin đọc). Client `logAudit()` ghi các thao tác admin; xem ở Quản lý ND → "Nhật ký".

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
