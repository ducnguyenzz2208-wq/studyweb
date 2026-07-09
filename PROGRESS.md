# Tutor Hub — Progress

> App quản lý trung tâm gia sư. Live: https://studyweb-swart.vercel.app

## Thư mục nộp bài → TRANG nộp bài riêng (Moodle-style) ✅ ĐÃ LÀM
- [x] **Bấm thư mục → sang trang nộp bài** (10-assignments.js + CSS): thay vì hiện composer/bài nộp
      inline trong thanh bài tập, mỗi thư mục giờ là **1 dòng bấm được** (`_folderRow`) → mở
      `_renderFolderPage()` (state `_folderView={aid,fid}`, `renderClassFeed` route sang trang này).
      Vẫn nằm trong mục Bài tập nên **thanh nav trái + class-sidebar giữ nguyên (đồng bộ)**. Có nút
      **← Quay lại** (`closeFolderPage`) + breadcrumb Lớp › Bài.
- [x] **Trong trang**: thẻ hạn nộp + **đếm ngược "Còn N ngày"/"Quá hạn N ngày"** (`_daysLeftInfo`, tô
      màu xanh/cam/đỏ theo mức khẩn); đề bài (mô tả + tài liệu GV); nút **Nộp/Cập nhật** (camera 1 chạm
      + tệp, dùng lại `_composerHtml`/`submitWork`); **giờ nộp** đầy đủ (`_fmtDateTime` +
      `submittedAtRaw` map mới, hiện "🕒 Nộp lúc: 09/07/2026 14:10"); **điểm + nhận xét** nếu GV đã chấm,
      còn chưa chấm thì "⏳ Chờ giáo viên chấm điểm".
- [x] **Phân quyền**: **HS chỉ thấy bài của mình** (`allSubs.find(studentId===_dbUserId)`), không thấy
      bài bạn khác; **GV/Admin quản lý cả thư mục** — xem & chấm mọi bài nộp (`renderSubmissionRow` có
      Chấm điểm/Xoá), nút **Xoá thư mục**; GV không có ô nộp. Xoá đúng thư mục đang xem → tự thoát về
      feed; đổi section bằng nav → reset `_folderView` (không kẹt trang cũ).
- Verify (mock, HS+GV): dòng thư mục bấm được → trang có back/countdown "Còn 2 ngày"/giờ nộp/điểm 9-10
      /nhận xét/composer; HS KHÔNG thấy bài HS khác, GV thấy cả 2 + Xoá thư mục + Chấm điểm, GV không có
      composer; nộp trên trang → ở lại trang, hiện bài mới + "Chờ chấm"; back về feed; đổi nav reset đúng;
      class-sidebar vẫn hiển thị. `node --check` pass, 0 lỗi console.

## Reports & Analytics: GV chỉ thấy KPI/biểu đồ đúng môn mình dạy ✅ ĐÃ LÀM
- [x] **Lọc theo môn GV dạy** (09-reports-comments.js `renderReports`): task đề xuất join
      `classes/class_members/subjects/profiles` qua `subject_id`, nhưng schema thật KHÔNG có cột
      `subject_id` — `classes.subject` là TEXT, và `classes` cho GV **đã được `loadDbData()` scope sẵn**
      theo `owner_id = GV` (RLS 008). Nên bỏ qua query Supabase thêm; `_teacherReportSubjects()` suy môn
      GV dạy trực tiếp từ mảng `classes` đang có trong bộ nhớ (distinct `c.subject`), 0 query mới.
- [x] Ẩn hẳn KPI **"Điểm TB Toán"/"Điểm TB Anh"** nếu GV không dạy môn đó; **Score Distribution** chỉ vẽ
      dataset Math/English tương ứng (`.filter(Boolean)`); **Top Students/At-Risk** xếp hạng & hiện điểm
      theo ĐÚNG môn GV dạy (`_relevantAvg`) — dạy 1 môn thì không trộn điểm môn kia; **Số bài nộp theo
      bài tập** lọc `assignments` theo đúng (các) môn GV dạy trước khi vẽ. Dạy nhiều môn (Math+English) →
      giữ nguyên hành vi gộp trung bình như cũ. GV không dạy Math/English (vd chỉ Chinese, đúng như
      trường hợp thật) → cả 2 KPI/dataset ẩn, `_relevantAvg` fallback về trung bình gộp (an toàn, tránh
      Top Students trống trơn). Admin/vai trò khác: `teacherSubjects=null` → không lọc, giữ nguyên
      overview toàn trung tâm.
- Verify (mock 4 kịch bản): GV chỉ dạy Chinese → ẩn cả 2 KPI điểm, biểu đồ điểm 0 dataset, biểu đồ nộp
      bài chỉ còn bài Chinese; GV dạy Math+English → y hệt hành vi cũ (gộp điểm, sort đúng); GV chỉ dạy
      Math → ẩn KPI Anh, chỉ dataset Math, Top Students xếp theo mathScore riêng; Admin dù chỉ có 1 lớp
      Chinese trong bộ nhớ vẫn thấy đủ Math+English/toàn bộ bài tập (không bị lọc). 0 lỗi console;
      `node --check` pass.

## Fix: Link tài liệu bị 404/403 khi bấm (đang cố Download thay vì mở link) ✅ ĐÃ LÀM
- [x] **Nguyên nhân gốc — lệch tên thuộc tính `type` vs `fileType`** (24-materials.js, bug có TỪ TRƯỚC,
      không phải do tính năng Link gây ra): `loadMaterials()` (02-db-api.js) và cả nhánh lưu cục bộ trong
      `saveMaterial` đều gán loại tài liệu vào thuộc tính **`m.type`**. Nhưng `renderMaterials`,
      `_isImage`, `fileBadgeClass`, bộ lọc loại, và `openMaterialModal` lại đọc **`m.fileType`** (luôn
      `undefined` với dữ liệu thật từ DB) → badge loại tài liệu hiện trống rỗng, `isLink` không bao giờ
      đúng dù DB đã lưu `type:'Link'` chính xác → tài liệu Link vẫn hiện nút **"⬇ Download"** thay vì
      "🔗 Mở liên kết", bấm vào trình duyệt cố `fetch`/tải cưỡng bức link Google Drive → Google trả về
      403/404 (không có quyền) vì đây là điều hướng thường chứ không phải file tải được.
- [x] **Fix**: đổi toàn bộ 7 chỗ đọc `m.fileType` → `m.type` trong 24-materials.js (badge, `_isImage`,
      bộ lọc loại, `isLink` ở cả `renderMaterials` và `openMaterialModal`, dropdown loại trong modal sửa).
      **Không cần sửa dữ liệu cũ** — vì `saveMaterial` vốn đã ghi đúng `type:'Link'` vào DB (dùng biến cục
      bộ từ dropdown, không phải `m.fileType`), tài liệu Link đã tạo trước đó tự hiển thị đúng ngay sau
      khi deploy, không cần đăng lại. Nút Link giờ là `<a target="_blank">` KHÔNG có thuộc tính
      `download` → trình duyệt điều hướng mở tab mới bình thường thay vì cố tải xuống.
      Verify: mock tài liệu `type:'Link'` (đúng dữ liệu như trong ảnh lỗi) → badge "Link" đúng màu, nút
      "🔗 Mở liên kết" không có `download`, target=_blank; sửa tài liệu Link cũ pre-fill đúng URL; bộ lọc
      Link/PDF lọc đúng; tài liệu PDF thường không bị ảnh hưởng (vẫn badge "pdf" + nút Download có
      `download` attr); 0 lỗi console.

## Materials: cho phép đăng LINK (URL) ngoài tệp ✅ ĐÃ LÀM
- [x] **Thêm loại "🔗 Link (URL)" trong Tài liệu** (24-materials.js + 12-ui-core.js + HTML): trước đây
      chỉ up được TỆP. Nay chọn loại **Link** ở modal → ô "File" đổi thành ô **URL** (`toggleMatSource()`
      ẩn/hiện theo loại). `saveMaterial` nhận loại Link → lưu URL vào `file_url`/`url` (tự thêm `https://`
      nếu thiếu), KHÔNG upload storage. Thẻ tài liệu Link hiện badge **Link** (màu cyan), meta hiện tên
      miền (`_linkHost`, vd "drive.google.com"), nút **"🔗 Mở liên kết"** mở tab mới (`target=_blank`) —
      học sinh bấm là vào link GV gửi. Bộ lọc loại thêm option **Link**. `deleteMaterial` không cố xoá
      storage với link ngoài (path rỗng). Cột `materials.type` là TEXT (không CHECK) nên lưu 'Link' an toàn.
      Verify: mock tạo Link → lưu url + type=Link; render nút mở liên kết target=_blank; up tệp vẫn như cũ.

## Fix Materials delete + Assignments dạng thanh ngang (Moodle) + thư mục nộp bài ✅ ĐÃ LÀM
- [x] **Fix "không xoá được tài liệu" + hết `Uncaught SyntaxError`** (24-materials.js): id tài liệu DB
      là **UUID** (vd `d1371f60-491d-…`) nhưng nút Sửa/Xoá chèn id **KHÔNG có nháy** →
      `onclick="deleteMaterial(d1371f60-491d-…)"`; `491d` là token số sai → SyntaxError, click chết
      (không xoá được). Sửa: bọc `qid(m.id)` cho openMaterialModal/deleteMaterial + `saveMaterial`.
      **Đồng thời xoá luôn FILE trong Storage** (trước chỉ xoá bản ghi DB → file mồ côi): `deleteMaterial`
      gọi `storage.from('materials').remove([path])`; lấy path từ `file_path` (map thêm `filePath` trong
      `loadMaterials`) hoặc suy ra từ public URL (`_storagePathFromUrl`). Verify: onclick parse OK, mock
      xoá gọi cả DB.delete lẫn storage.remove đúng path (kể cả URL cũ có %20).
- [x] **Tái cấu trúc Assignments: bỏ "Facebook feed" → THANH NGANG accordion (kiểu Moodle)**
      (10-assignments.js `renderPostCard` + CSS): mỗi bài là 1 `<details class="asn-bar">` — thanh gọn
      (icon môn · tiêu đề · môn·hạn · trạng thái · tiến độ/bài nộp); bấm mở ra body. Nằm trong section
      Tuần (nested accordion). Không còn card cuộn dọc luôn-mở.
- [x] **Homework lồng trong Assignment**: body chia rõ **📄 Đề bài (Homework)** (mô tả + tài liệu/đề GV
      đăng) và **📤 Nộp bài** (khu nộp của HS) ở ngay dưới. GV có toolbar Sửa/Xoá/Tạo thư mục.
- [x] **Thư mục nộp bài do GV tạo** (task 4): nút **"📁 Tạo thư mục nộp bài"** (`openFolderModal`/
      `saveFolder`/`deleteFolder`) — GV cấu trúc sẵn thư mục (VD "Bài tập về nhà Tuần 1", "Bài bổ sung").
      Khu nộp HS **chia theo từng thư mục**, mỗi thư mục 1 composer (📸 camera 1 chạm + 📎 + Nộp) nộp
      riêng; bài nộp gom đúng thư mục; tiến độ "📤 x/y thư mục". Bài cũ không thư mục → mục "Chưa phân loại".
      Cần **migration `026_assignment_folders.sql`** (thêm `assignments.folders` jsonb +
      `assignment_submissions.folder_id` + đổi UNIQUE → (assignment_id, student_id, folder_id) cho phép
      nộp nhiều thư mục). **An toàn khi CHƯA chạy 026**: `_upsertSubmission` tự nhận diện cột thiếu (lưu
      cờ `th_sub_folders`) → nộp mặc định fallback luồng cũ (KHÔNG hỏng); nộp vào thư mục có tên thì báo
      "cần chạy migration 026". Verify: GV thấy 2 thư mục + bài gom đúng; HS thấy composer/thư mục + "📤
      1/2"; post-migration onConflict gồm folder_id; pre-migration default fallback OK, folder bị chặn +
      toast; mobile nút 44px; 0 lỗi console; `node --check` pass.
- **Việc thủ công**: chạy `026_assignment_folders.sql` trong Supabase để bật thư mục nộp bài (không
      chạy vẫn nộp bài bình thường ở khu mặc định).
- [x] **Fix spam 400 "Could not find the 'folders' column" khi tạo thư mục** (chưa chạy migration 026):
      thêm cờ `_asnFoldersReady` (localStorage `th_asn_folders`). Phát hiện cột `folders` tồn tại hay
      không NGAY khi tải bài tập (`'folders' in row` của `select('*')` — KHÔNG tốn query/400). Khi CHƯA
      bật, nút "📁 Tạo thư mục" mở **bảng hướng dẫn** (`_folderSetupModal`: 3 bước + SQL copy sẵn) thay vì
      gọi DB → hết 400 trong F12. `saveFolder` cũng chặn khi chưa bật. Tự bật lại khi migration đã chạy
      (cột xuất hiện → cờ '1'). Verify: pre-migration mở modal = 0 PATCH + hiện guide; post-migration tạo
      thư mục lưu bình thường; 0 lỗi console.

## UX cho Học sinh cấp 2 (11–15 tuổi): camera + to-do + nav gọn + confetti ✅ ĐÃ LÀM
Tối ưu trải nghiệm HS trên điện thoại/PC. Giữ classic-JS scope, không đụng auth/RLS.
- [x] **Nộp bài 1 chạm bằng camera** (10-assignments.js): composer trong feed có thêm nút **📸 Chụp
      bài làm** (`<input capture="environment" accept="image/*">` → mở thẳng camera sau trên ĐT) bên
      cạnh **📎 Chọn ảnh/PDF** (`accept="image/*,application/pdf"`). `_subFilePicked(id, which)` giữ 1
      nguồn (chọn cái này xoá cái kia). Nút "Nộp/Cập nhật" khi bấm → **disabled + "⏳ Đang tải bài
      lên..."** (chống bấm lặp), mở lại nút khi lỗi; thành công thì feed tự render lại.
- [x] **Dashboard HS = danh sách To-do** (22-student-portal.js + HTML): thẻ **"📋 Việc cần làm"** đẩy
      lên TRÊN CÙNG (full-width), kèm badge số bài chưa nộp. Mỗi bài có badge **đèn giao thông**
      (`_hwStatus`): 🔴 Quá hạn (badge-danger) · 🟠 Sắp hết hạn <48h (badge-warning) · ⚪ Chưa nộp ·
      🟢 Đã nộp (badge-success); danh sách **tự sắp** khẩn cấp lên trước. Nút **"Nộp ngay"** cạnh mỗi
      bài chưa nộp → mở thẳng modal nộp (`quickSubmit`), không phải vào xem chi tiết lớp. Việt hoá
      nhãn KPI/Focus (Điểm của em, Chuyên cần, Lớp học, Cần cải thiện, Bảng điểm, Toán/Tiếng Anh).
- [x] **Modal "Nộp ngay"** (10-assignments.js): `quickSubmit`/`quickSubmitSave` dùng CHUNG lõi
      `_persistSubmission` (upload→upsert `assignment_submissions`, cùng luồng camera 1 chạm + loading
      button) với composer trong feed → không nhân đôi logic DB.
- [x] **Sidebar gọn cho HS** (05-navigation.js + 03-i18n-data.js): khi role=Student dùng `STUDENT_NAV`
      (nhãn tiếng Việt gần gũi, không lệ thuộc i18n): **Việc cần làm** / Học tập(**Bài tập về nhà**,
      **Bài giảng & Tài liệu**) / Lịch(**Lịch học**) / Công cụ tự học(**Tập trung (Pomodoro)**, **Thẻ
      ghi nhớ**) / **Cài đặt**. Bỏ **payments** khỏi `ROLE_SECTIONS.Student` (học phí vẫn xem trong
      Cổng học sinh). Teacher/Admin nav GIỮ NGUYÊN (14 mục) — chỉ HS được rút gọn.
- [x] **Confetti ăn mừng** (12-ui-core.js `celebrate()`): pháo giấy **canvas tự chứa** (KHÔNG cần CDN →
      an toàn CSP + offline), z-index 99998, `pointer-events:none`, tự xoá sau 2.2s, **tôn trọng
      `prefers-reduced-motion`**. Gọi khi nộp bài thành công (cả composer & modal).
- **Verify (preview mock)**: nav HS đúng 7 mục + 4 nhóm (bỏ Payments); to-do sắp đúng thứ tự
      🔴→🟠→⚪→🟢 + "Nộp ngay" đúng chỗ; composer/modal có `capture=environment` + accept ảnh/PDF;
      submitWork khoá nút "⏳", nộp xong ô trống + badge "Cập nhật"; `celebrate()` tạo canvas ngay,
      reduced-motion off thì chạy; mobile 375px nút "Nộp ngay" full-width 44px; Teacher nav nguyên vẹn;
      0 lỗi console; `node --check` 5 module pass.

## Fix: hết spam 404 log_audit khi cấp quyền ✅ ĐÃ LÀM
- [x] **404 `rpc/log_audit` khi đổi vai trò / xuất báo cáo** (02-db-api.js `logAudit`): việc cấp
      quyền THỰC RA vẫn thành công (`admin_set_role` + fallback update `profiles`); chỉ có bước ghi
      nhật ký best-effort gọi RPC `log_audit` bị 404 vì **migration `020` chưa chạy**. 404 là lỗi
      tầng mạng nên trình duyệt luôn in đỏ ở F12 dù đã try/catch — cách duy nhất để hết là NGỪNG gọi.
      Cờ `_auditOff` cũ chỉ sống trong RAM nên mỗi lần tải lại lại 404 một lần. Fix: **lưu cờ vào
      localStorage** (`th_audit_off`): sau lần đầu phát hiện thiếu hàm (khớp `PGRST202`/"not find"/
      "schema cache"/404), mọi phiên sau KHÔNG gọi nữa → sạch console khi cấp quyền. Thêm `.catch()`
      cho promise RPC + helper `thAuditReset()` (gõ trong console) để bật lại nhật ký sau khi đã chạy
      `020`. Verify (mock `_db.rpc` trả PGRST202): lần 1 gọi → set cờ + persist; lần 2/3 skip (0 gọi);
      sau reload cờ còn → skip luôn; `thAuditReset()` xoá cờ → gọi lại bình thường. `node --check` pass.
- **Fix thật (tuỳ chọn, để CÓ nhật ký + hết luôn 404 ngay lần đầu)**: chạy migration
      `020_audit_log.sql` trong Supabase SQL Editor rồi `thAuditReset()`. Không chạy cũng không sao —
      nhật ký chỉ là phụ; cấp quyền/mọi thao tác khác vẫn chạy đúng.

## Fix: mất section khi F5 + kẹt chữ ô nộp bài ✅ ĐÃ LÀM
- [x] **Mất trạng thái trang khi F5** (12-ui-core.js `showSection` + 04-auth.js `showApp`):
      thêm `sessionStorage.setItem('th_last_section', id)` song song với `localStorage` sẵn có.
      Khi khởi tạo, `showApp` giờ ưu tiên đọc `sessionStorage` (đúng phiên tab hiện tại, đáng tin
      nhất ngay sau F5) → rồi mới tới `hash` → rồi `localStorage`; chỉ khi KHÔNG có gì lưu (lần
      đăng nhập đầu tiên trong tab) mới rơi về mặc định theo vai trò (`DEFAULT_SECTION`, HS →
      `student-portal`). Đồng thời BỎ đoạn ép cứng "HS luôn mở Portal, bỏ qua tab đã lưu" thêm ở
      đợt patch trước — đoạn đó chính là nguyên nhân HS bị đá khỏi Assignments mỗi lần F5; giờ dùng
      đúng cơ chế ưu tiên storage nên vừa giữ được auto-open Portal ở lần đăng nhập đầu, vừa giữ
      đúng section sau F5. Lưu ý triển khai: luồng nhận `TUTOR_HUB_INIT` thực tế nằm ở
      `01-core-state.js` (gọi `showApp()` trong `04-auth.js`), KHÔNG phải `25-init.js` như đề bài
      giả định — `25-init.js` chỉ có phần init DOM/error-monitoring cho chế độ standalone.
      Verify: quickLogin → showSection('assignments') → giả lập `location.reload()` → sessionStorage
      còn 'assignments' → re-auth → land đúng lại 'assignments' (không về dashboard/portal mặc định).
- [x] **Kẹt chữ ô nộp bài sau khi Nộp/Cập nhật** (10-assignments.js `submitWork`/`reloadSubmissions`):
      nguyên nhân KHÔNG phải do thiếu reset — composer cố ý pre-fill `value` từ `mySub.content` để hỗ
      trợ "Sửa" bài đã nộp, nên sau khi `renderAssignments()` vẽ lại nó tự điền lại đúng chữ vừa gửi,
      trông như "kẹt". Fix: `reloadSubmissions(onDone)` nhận callback, gọi SAU khi
      `renderAssignments()` xong; `submitWork` truyền callback xoá `subInput_<id>`, `subFile_<id>`
      (input file) và `subFileName_<id>` (tên tệp hiển thị) về rỗng — chữ biến mất ngay sau khi nộp,
      không ảnh hưởng nút "Cập nhật"/luồng sửa bài (mở lại `focusComposer` vẫn hoạt động bình thường
      cho lần sửa kế tiếp). Verify: mock `_db` giả lập upsert+select → nộp "em nộp bài ạ" → bài hiện
      đúng trong thread + nút đổi "Cập nhật" + input rỗng ngay sau đó.
- `node --check` 3 module pass, 0 lỗi console khi test trong preview.

## UI: Sidebar thu gọn thông minh + Portal cho HS + fix loop refresh 400 ✅ ĐÃ LÀM
- [x] **Student Portal lên đầu sidebar** (05-navigation.js): nhóm `Portals` (student-portal +
      parent-portal) chuyển lên ĐẦU `NAV_STRUCTURE` (trên Main/Academic). Với HS → "Cổng học sinh"
      là mục đầu tiên; với PH → "Cổng phụ huynh"; Teacher/Admin không có mục Portal trong
      `ROLE_SECTIONS` nên nhóm rỗng tự ẩn (Main/Dashboard vẫn đứng đầu như cũ). Verify (mock HS):
      `navOrder[0]='Cổng học sinh'`, group đầu = `Portals`.
- [x] **HS tự mở Cổng học sinh khi khởi tạo** (04-auth.js `showApp`): nếu `currentUser.role==='Student'`
      thì ép `first='student-portal'`, BỎ QUA tab đã lưu (`th_section`) — tránh HS rơi vào Cài đặt/Bài
      tập sau khi tải lại. Verify: dù set `th_section='settings'`, HS vẫn land ở `student-portal`.
      (Luồng init thật chạy qua `TUTOR_HUB_INIT` → `showApp()`; DEFAULT_SECTION.Student vốn đã là portal.)
- [x] **Smart collapsible sidebar (CSS-only)** (tutor-hub-app.html): thêm `@media (min-width:769px)`
      (khớp breakpoint desktop có sẵn — drawer mobile là ≤768px nên KHÔNG dùng 641px để tránh vùng
      641–768 xung đột với drawer). Mặc định `#sidebar` rộng **68px** (chỉ icon), rê chuột `:hover`
      → **216px** hiện nhãn; nhãn/tiêu đề (`.logo-text/.sidebar-section/.nav-label/.user-info`)
      `opacity:0→1` + `white-space:nowrap` + `transition:.2s`. `#main` (phần tử thật giữ offset, KHÔNG
      phải `.content`) `margin-left` co giãn 68↔216 mượt (`#sidebar:hover ~ #main`, `transition .3s`).
      Bọc nhãn nav trong `<span class="nav-label">` để fade sạch. Giữ nguyên `body.sidebar-hidden`
      (nút ☰). Verify: desktop collapsed=68px/label opacity 0, hover rule có trong CSSOM; mobile 375px
      vẫn là drawer translateX(-216), không bị ép 68px.
- [x] **Fix loop lỗi 400 refresh_token (F12)** (02-db-api.js): supabase-js tự refresh token nền;
      refresh token của iframe & Next.js dùng chung nên bị **xoay vòng** → 400 (Bad Request) lặp vô hạn.
      Thêm `_isRefresh400()` (bắt status 400 / "refresh token"/"already used"…) + `_breakAndRelogin()`
      (`stopAutoRefresh()` để tắt loop NGAY + `reloginNow()` phát `TUTOR_HUB_LOGOUT` → parent signOut →
      `/login`, reset session sạch). Wire: `onAuthStateChange('SIGNED_OUT')`, `refreshSession` định kỳ,
      và `_onDbAuthError` — gặp 400 thì ngắt loop + relogin thay vì spam/overlay.
- [x] **Toggle thông báo (Cài đặt) lưu đúng** (07-notifications.js + HTML): 3 nút trước chỉ toggle class
      `on` (mất khi reload/relogin). Nay `toggleNotifPref(btn,key)` lưu `th_notif_prefs` (localStorage,
      không phụ thuộc phiên) + `restoreNotifPrefs()` gọi trong `showApp`. Verify: tắt/bật → lưu đúng,
      restore khôi phục đúng trạng thái. 0 lỗi console; `node --check` 4 module pass.

## Nhập học sinh từ Excel/CSV (User Management) ✅ ĐÃ LÀM
- [x] Nút **"📥 Nhập Excel/CSV"** ở Quản lý người dùng → `openStudentImportModal()` (11-user-management.js).
      Hỗ trợ **.xlsx/.xls/.csv** (SheetJS nạp lười từ jsDelivr — đã trong CSP) + ô **dán text** (copy từ
      PDF/Word). Tự nhận cột **Tên/Email/Lớp** theo tiêu đề (mọi thứ tự) hoặc theo vị trí; tự dò email
      theo dấu "@". Có preview + lớp mặc định + tải tệp mẫu CSV. Chèn vào `students` (owner=current user).
      Verify: modal + parser (đổi thứ tự cột, thiếu email) + SheetJS round-trip dưới CSP OK, 0 lỗi console.
- [x] **Classes kiểu Moodle (weeks + feed nộp bài giống Facebook)** ✅ ĐÃ LÀM (cần chạy migration `025`):
      Mục **Bài tập** (class-feed) giờ chia thành **📌 General + Tuần 1..N + Ngoài kỳ học** (accordion
      `<details>`). GV/Admin bấm **"🗓 Kỳ học"** đặt *Tuần 1 bắt đầu ngày… / số tuần* (`openClassTermModal`
      → lưu `classes.term_start`/`term_weeks`). Bài tự xếp vào tuần theo **hạn nộp** (`_classWeeks`/`_weekOf`
      trong 10-assignments.js); HS **nộp bài inline** như cũ (không đổi luồng submit). Tuần hiện tại tự mở.
      Chưa đặt kỳ → feed phẳng + nhắc GV đặt. migration `025_class_term_weeks.sql` (+ policy admin update
      class). Verify: gom tuần đúng (General/Tuần1/Tuần2/Ngoài-kỳ), student thấy section + composer nhưng
      không thấy nút GV, term modal mở đúng, 0 lỗi console, build pass.

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
- [ ] **Chạy migration `025_class_term_weeks.sql`**: thêm `term_start`/`term_weeks` vào `classes` cho
      tính năng "Kỳ học theo tuần". Chưa chạy: nút "🗓 Kỳ học" lưu sẽ báo lỗi cột; feed vẫn hiện phẳng.
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
- [x] **Token iframe hết hạn giữa phiên** — ĐÃ LÀM (02-db-api.js): `startSessionGuard()` chủ động
      `refreshSession()` mỗi 15' + khi quay lại tab; `_isAuthError()` bắt lỗi JWT/401/PGRST301 →
      `_onDbAuthError()` thử làm mới token 1 lần, không được thì hiện lớp phủ "Phiên hết hạn — Đăng
      nhập lại" (`reloginNow()` postMessage TUTOR_HUB_LOGOUT). Verify: phân loại lỗi đúng.
- [x] **Dứt điểm ranh giới demo ↔ DB thật** — ĐÃ LÀM. Rà soát: mọi mục nav-reachable đều đã DB-hoá
      (Students/Classes/Assignments/Attendance/Payments/Schedule/Materials/Flashcards/Subjects/Comments).
      Chỗ DUY NHẤT còn local-only reachable: Quick Action "Thêm bài tập" trỏ `openHomeworkModal()`
      (mục Homework cũ, lưu RAM → reload mất). Đã đổi → `showSection('assignments')` (hệ thống bài tập
      THẬT, có DB). Mục Homework cũ giờ không còn lối vào từ UI. Pomodoro dùng localStorage là CHỦ Ý.
- [x] **Error/empty/loading states cho các mục DB** — ĐÃ XONG cho tất cả: Students/Materials/Payments/
      Flashcards/Schedule + đợt này **Attendance + Assignments** (`_dbError.<sec>` + `errorBlock`/`retryLoad`,
      wire cả loader lẫn `_rerenderAfterLoad`). Verify: bơm lỗi giả → hiện khối lỗi + nút Thử lại.

### P2 — Hạ tầng vận hành
- [x] **Error monitoring nhẹ** — ĐÃ LÀM (25-init.js): bắt `window.onerror` + `unhandledrejection`,
      lưu 30 lỗi gần nhất vào `localStorage` (`th_errlog`). Xem bằng `thErrors()` / xoá `thClearErrors()`
      trong console. (Có thể nâng lên Sentry sau.)
- [x] **Smoke test e2e (Playwright)** — ĐÃ LÀM, **6 test PASS** (17s). `playwright.config.ts`
      (webServer `next dev`) + `e2e/smoke.spec.ts` chạy trên CHẾ ĐỘ MOCK (mở thẳng `tutor-hub-app.html`
      → quickLogin, KHÔNG cần Supabase). Phủ: đăng nhập demo, điều hướng, bảng Học sinh có dữ liệu,
      thêm học sinh, Pomodoro 25:00 + start, phân quyền (HS không thấy Quản lý ND), trang `/login` render.
      Chạy: `npm run test:e2e`. (devDep `@playwright/test`; artifacts đã ignore trong `.gitignore`.)
- [ ] **Backup dữ liệu** Supabase (PITR/định kỳ) trước khi có dữ liệu thật — thao tác Dashboard (của bạn).

### Đã sửa thêm đợt này
- [x] **Nhạc/ghi chú/Pomodoro theo TỪNG tài khoản**: khoá localStorage gắn `_dbUserId`
      (`_pk()` trong 26-pomodoro.js) → mỗi người tự up nhạc, ghi chú, chuỗi tập trung riêng, không
      dùng chung dù cùng trình duyệt. Verify: user A có note, user B thấy 0.
- [x] **Dọn lỗi F12**: `log_audit` 404 spam → cờ `_auditOff` tắt gọi sau lần đầu thấy hàm thiếu
      (migration 020 chưa chạy); thêm favicon (`app/icon.svg` + `<link rel=icon>` data-URI trong app HTML)
      → hết `favicon.ico 404`.

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
> **Đã tự động hoá phần UI** bằng e2e (mock mode): đăng nhập theo vai trò, điều hướng, thêm học sinh,
> phân quyền HS↔Admin. Các mục phụ thuộc SUPABASE thật (đăng ký/email/duyệt/RLS) vẫn cần bạn chạy tay.
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
