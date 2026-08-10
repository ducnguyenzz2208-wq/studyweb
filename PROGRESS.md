# Tutor Hub — Progress

> App quản lý trung tâm gia sư. Live: https://studyweb-swart.vercel.app

## Flashcard: Phiên âm IPA (Tiếng Anh) & Pinyin (Tiếng Trung) + Nhận diện câu trả lời gần đúng ✅ ĐÃ LÀM
- [x] **Module MỚI `public/js/29-flashcard-phonetics.js`**: Tự động nhận diện ngôn ngữ và sinh phiên âm IPA chuẩn cho từ Tiếng Anh (ví dụ: `Dog` -> `/dɒɡ/`). Đã loại bỏ tính năng tự nhận diện Pinyin tiếng Trung theo yêu cầu để tập trung thử nghiệm IPA.
- [x] **Hiển thị linh hoạt ở tất cả các chế độ**:
  - Danh sách thẻ (`openDeckDetail` trong `23-flashcards.js`)
  - Thẻ lật khi Học ngay (`renderStudyCard` trong `23-flashcards.js`)
  - Chế độ Học (`_learnRender` trong `27-flashcard-learn.js`)
  - Bài kiểm tra (`_renderTest` trong `28-flashcard-test-game.js`)
  - Màn hình xem trước khi Tạo/Sửa thẻ (`updateCardPreview` trong `23-flashcards.js`).
- [x] **Tính năng Nhập hàng loạt (Bulk Import)**:
  - Tự động thêm IPA vào sau mặt chữ của thẻ Tiếng Anh ngay khi nhập hàng loạt (`Apple` -> `Apple /ˈæp.l̩/`).
  - Sửa lỗi hiển thị trùng lặp: Nếu văn bản đã chứa ký hiệu IPA thì hệ thống sẽ không hiển thị thêm phonetic badge (phù hiệu âm thanh) tự động nữa.
  - Cải tiến tính năng phát hiện ngôn ngữ `fcDetectLang` trong `27-flashcard-learn.js`: Nhận diện chuẩn xác các nguyên âm có dấu đặc trưng của tiếng Việt (ví dụ: `Máy tính`) để tránh tình trạng hiển thị nhầm phiên âm tiếng Anh (IPA) cho tiếng Việt.
- [x] **Nhận diện câu trả lời gần đúng (Fuzzy Answer Matching)**: Nâng cấp thuật toán `_learnCheckWritten` trong `27-flashcard-learn.js`:
  - Tự động loại bỏ các lượng từ / từ chỉ loại tiếng Việt (`con`, `cái`, `quả`...) và mạo từ tiếng Anh (`a`, `an`, `the`, `to`).
  - Đánh giá câu trả lời `"chó"` đối với đáp án `"Con chó"` (hoặc ngược lại) là **ĐÚNG**.
  - Hỗ trợ so khớp trùng khớp cụm từ con (sub-phrase / token overlap) và mở rộng sai số gõ nhầm theo độ dài từ (Levenshtein edit distance).

## Flashcard: Liên kết bài kiểm tra trắc nghiệm sau phần học ✅ ĐÃ LÀM
- [x] Thêm nút "📝 Làm bài trắc nghiệm" vào màn hình hoàn thành của Chế độ Học (`27-flashcard-learn.js`). Nút này cho phép chuyển thẳng sang làm bài kiểm tra trắc nghiệm ngẫu nhiên để ôn lại những từ vừa học.
- [x] Sửa Bài kiểm tra (`28-flashcard-test-game.js`) để hỗ trợ cờ `mcOnly`, bắt buộc 100% câu hỏi là trắc nghiệm ngẫu nhiên, đáp ứng yêu cầu từ Unit 1.html.

## Flashcard: 2 chế độ mới — Bài kiểm tra (Test) + Trò chơi Ghép thẻ (Matching) ✅ ĐÃ LÀM
**Module MỚI `public/js/28-flashcard-test-game.js`** (nạp sau 27, trước 25-init) + 2 view container
`#flashcards-test-view` / `#flashcards-match-view` + 2 nút **📝 Bài kiểm tra** · **🎮 Trò chơi** cạnh
"🧠 Chế độ Học" trong trang chi tiết bộ thẻ.
- [x] **Tái sử dụng helper của 27** (không nhân đôi logic): `fcBuildChoices()` (dựng 4 lựa chọn + nhiễu,
      đã xử lý thẻ LaTeX/ảnh), `_learnCheckWritten()` (chấm tự luận thông minh), `_learnTypeable()`,
      `_fcPlainText/_fcShuffle/_fcCardHasContent/_learnChoiceKey/_fcLs*/_fcPk`, `fcSpeakBtnHtml()`.
      **Refactor nhỏ trong 27**: tách `_learnBuildChoices` → `fcBuildChoices(card, cards, deckId, count)`
      dùng chung cho cả Chế độ Học và Bài kiểm tra (Learn Mode verify lại vẫn nguyên: 18 lượt → thuộc hết).

### 1) Bài kiểm tra (Test Mode)
- [x] **Tối đa 20 câu**, sinh ngẫu nhiên từ bộ thẻ, **trộn 3 dạng ~40/30/30**: Trắc nghiệm (4 lựa chọn) ·
      Đúng/Sai (`«Thuật ngữ» có nghĩa là «Định nghĩa» ?` — 50/50 hiện đúng định nghĩa của thẻ hoặc của
      thẻ khác) · Tự luận ngắn. **Thẻ không gõ được (LaTeX/ảnh/đáp án dài) KHÔNG nhận dạng tự luận** → tự
      đổi sang trắc nghiệm (bộ Toán verify: 0 câu tự luận).
- [x] **Làm cả bài trên 1 trang → bấm Nộp bài**: điểm **%** (khối màu theo mức ≥80/≥50/<50), số câu
      đúng/sai, **đánh dấu ✅/❌ từng câu** + tô sáng đáp án đúng và đáp án đã chọn sai, **hiện đáp án
      đúng cho mọi câu sai**; nút **Làm lại bài test** + **Đề mới**. Còn câu bỏ trống thì hỏi lại trước
      khi nộp. Điểm ≥80% có confetti.
- [x] **Chi tiết triển khai**: chọn đáp án chỉ cập nhật class của ĐÚNG câu đó (`testSetMC/testSetTF`),
      KHÔNG vẽ lại cả bài → **không mất focus ô đang gõ**; nhãn tiến độ "Đã trả lời n/N" cập nhật riêng
      qua `_testSyncProgress()`. Test Mode **KHÔNG đụng tiến độ Leitner** của Chế độ Học (2 luồng độc lập).
- Verify (live): bộ Toán 6 thẻ → 6 câu (4 MC + 2 TF, 0 tự luận), MC luôn 4 lựa chọn, 26 `mjx-container`;
      bộ 12 thẻ chữ → 12 câu đủ **3 dạng** (6 MC + 3 TF + 3 tự luận); trả lời đúng câu chẵn/sai câu lẻ →
      **6/12 = 50%** khớp chính xác, 12 nhãn ✅/❌ đúng thứ tự, 6 khối "đáp án đúng"; tự luận chấp nhận
      HOA và dấu câu/khoảng trắng thừa; bỏ trống → hỏi "Còn 9 câu chưa trả lời".

### 2) Trò chơi Ghép thẻ (Matching Game)
- [x] **6–8 cặp → lưới 12–16 ô xáo trộn** (`_fcShuffle` trên mảng tile nên thuật ngữ/định nghĩa nằm lộn
      xộn, verify thứ tự không xen kẽ T/D). Lưới **4 cột** desktop → 3 cột ≤900px → **2 cột** ≤640px.
- [x] **Bấm 2 ô**: ghép đúng (**cùng thẻ, khác mặt**) → 2 ô mờ đi (`.matched`, `pointer-events:none`,
      giữ nguyên layout); ghép sai → **nháy đỏ + rung** rồi **đảo lại** (bỏ chọn cả 2) sau 700ms, có
      `lock` chặn click trong lúc nháy. Bấm lại ô đang chọn để bỏ chọn.
- [x] **Đồng hồ giây** (`⏱ 0.0s`, cập nhật 100ms) + đếm **cặp đã ghép** và **lượt thử**; xong ván hiện
      thời gian + confetti + **kỷ lục theo từng bộ thẻ** (`th_fc_match_best_<deckId>` theo tài khoản,
      báo "Kỷ lục mới 🏆" khi phá).
- [x] **Dọn tài nguyên**: `fcHideTestGame()` (gọi từ `_hideLearnView` trong 23-flashcards.js) và
      `_fcOnlyView()` đều **dừng interval đồng hồ + xoá state + dọn DOM** của màn bị ẩn.
      **Bug tự bắt khi test**: chuyển Bài kiểm tra → Trò chơi thì `_testState` và DOM bài cũ vẫn còn
      (rác bộ nhớ); đã cho `_fcOnlyView` dọn hẳn state của mọi màn động bị ẩn.
- Verify (live): bộ 12 thẻ → **8 cặp/16 ô, lưới 4×4**, 8 thuật ngữ + 8 định nghĩa, xáo trộn thật, đồng hồ
      chạy; ghép sai → 2 ô `.wrong` + `lock=true` + click bị chặn → sau 700ms tự đảo lại; ghép đúng →
      `matched` +1, 2 ô mờ; ghép hết → màn hoàn thành + kỷ lục lưu đúng + **timer dừng**; thoát/điều
      hướng sang section khác → timer dừng, state null, DOM dọn (không rò rỉ interval).
- [x] **Hiển thị đa nội dung**: mọi nội dung chèn RAW HTML rồi gọi `typesetMath()` → bộ Toán 6 cặp/12 ô
      render 13 `mjx-container`; bộ chữ Trung **phồn thể (學習/謝謝) + giản thể (你好)** và tiếng Việt hiện
      đúng trong ô ghép. Ô ghép clamp `max-height` + `overflow:hidden` để định nghĩa dài không phá lưới.
- **Trường hợp biên**: bộ 2 thẻ → 2 cặp/4 ô (không lỗi); bộ 1 thẻ → chặn kèm thông báo rõ
      ("Cần ít nhất 2 thẻ đủ 2 mặt"); bộ ít hơn 10 thẻ → bài test lấy hết số thẻ có (KHÔNG nhân bản câu
      hỏi để cố đủ 10 — thà ít câu thật hơn là hỏi lặp).
- **Ghi chú TTS**: 2 chế độ này KHÔNG tự động đọc (bài test hiện 20 câu cùng lúc, đọc tự động sẽ thành
      nhiễu); mỗi câu hỏi có **nút loa 🔊 thủ công** đọc đúng mã lang của thẻ. Quy tắc "chỉ tự động đọc
      mặt trước" ở Học thẻ/Chế độ Học giữ nguyên.
- `tsc --noEmit` sạch, `node --check` 3 module pass, **0 lỗi console**; mobile 375px: MC 1 cột, nút
      Đúng/Sai 46px, ô nhập 16px (không bị iOS tự phóng), lưới ghép 2 cột, không tràn ngang.

## Flashcard TTS v5: 19 ngôn ngữ + bảng chọn/nghe thử giọng ✅ ĐÃ LÀM
- [x] **Mở rộng 14 → 19 ngôn ngữ**: thêm `es-MX`, `it-IT`, `pt-BR`, `id-ID`, `hi-IN`, `ar-SA`; bổ sung
      tên giọng Natural/Neural thật cho từng ngôn ngữ vào bảng Nữ/Nam (Denise/Henri, Katja/Conrad,
      Elvira/Alvaro, Elsa/Diego, Francisca/Antonio, Premwadee/Niwat, Gadis/Ardi, Swara/Madhur,
      Zariyah/Hamed…) + 15 câu mẫu để nghe thử theo đúng ngôn ngữ.
- [x] **BẢNG CÀI ĐẶT GIỌNG ĐỌC mới** (`openFcVoiceSettings`, nút "🔊 Giọng…" ở thanh công cụ Học thẻ và
      header Chế độ Học): liệt kê **giọng THẬT của máy** theo từng ngôn ngữ (kèm ♀/♂ và nhãn chất lượng
      Tự nhiên/Khá/Cơ bản), cho **nghe thử** bằng câu mẫu đúng ngôn ngữ, và **GHIM** giọng mình thích —
      lựa chọn ghim **thắng mọi phỏng đoán** của bộ tự chọn (`_fcPickVoice` kiểm tra ghim trước tiên).
      Lưu `th_fc_voicemap` theo tài khoản. Ngôn ngữ nào máy chưa có giọng thì nói thẳng + chỉ cách cài.
      Bảng chỉ hiện ngôn ngữ đang dùng trong app + ngôn ngữ máy có giọng (không dài 19 dòng vô ích).
- [x] **Fix bug khớp giới tính theo CHUỖI CON** (`_fcVoiceGender`): tên giọng luôn kèm tên ngôn ngữ nên
      khớp chuỗi con sai nặng — `'ali'` nằm trong **"Italian"** (⇒ mọi giọng Ý thành Nam), `'ana'` nằm
      trong **"Canada"**, `'eric'` nằm trong **"America"**. Đã đổi sang **khớp theo TỪ** (tách tên thành
      token rồi so bằng nhau) → nhờ vậy mới thêm an toàn được các tên ngắn như Ali, Ana, Eric.
- [x] **Fix pitch không khớp giọng thật**: `fcSpeak` lấy pitch theo giới tính *đang yêu cầu*, nên khi
      người dùng **ghim giọng nam** mà lượt đó xen kẽ đang xin giọng nữ thì giọng nam bị đẩy lên
      pitch 1.08 → nghe rất giả. Nay pitch suy từ **giọng THỰC SỰ dùng** (`_fcVoiceGender(v)`), chỉ khi
      không đoán được mới rơi về giới tính yêu cầu.
- Verify (live): 8/8 ca khớp giới tính đúng, gồm "Elsa - Italian (Italy)"→nữ và "Richard - English
      (Canada)"→unknown (2 ca trước đây SAI); bảng hiện đúng 3 dòng trên máy test (en-US/en-GB có giọng,
      vi-VN báo thiếu), summary "2/3 ngôn ngữ · 3 giọng"; ghim Mark rồi xin giọng nữ → vẫn ra Mark và
      **pitch 0.88** (không còn 1.08); ghim Zira rồi xin nam → Zira + 1.08; bỏ ghim → xen kẽ Zira/David
      như cũ; nghe thử vi-VN/ja-JP đọc đúng câu mẫu + đúng `lang`; lưu bền localStorage; mobile 375px
      bảng 1 cột không tràn; hồi quy 5 chế độ Flashcard OK; `tsc` sạch, 0 lỗi console.
- **⚠️ Giới hạn kỹ thuật (không phải lỗi)**: Web Speech API **chỉ dùng được giọng đã cài trên máy** —
      trang web KHÔNG thể tải thêm giọng bằng JavaScript. Máy dev chỉ có 3 giọng Windows tiếng Anh
      (David/Mark/Zira) nên tiếng Việt/Trung/Nhật/Hàn vẫn đọc bằng giọng mặc định ở đó. Muốn giọng tự
      nhiên: dùng **Edge** (có sẵn giọng "Online (Natural)" cho vi/zh/ja/ko) hoặc Windows → Cài đặt →
      Thời gian & Ngôn ngữ → Giọng nói → Thêm giọng. Bảng cài đặt mới hiện rõ máy đang thiếu giọng nào.

## Fix: Trắc nghiệm bộ Toán chỉ có 1 ô + TTS chỉ đọc tiếng Anh ✅ ĐÃ LÀM
### 1) Trắc nghiệm luôn đủ 4 ô (lưới 2x2) cho MỌI môn
- [x] **Nguyên nhân gốc** (`_learnBuildChoices`): pool đáp án nhiễu lọc bằng
      `if (!txt && !_fcHasImage(c.back)) return;` với `txt = _fcPlainText(c.back)`. Mặt sau thẻ Toán là
      **LaTeX thuần** (`\(3x^2\)`) → lột LaTeX xong còn **chuỗi RỖNG** → **5/6 thẻ Toán bị loại sạch**
      khỏi pool → trắc nghiệm chỉ render **2 ô** (đo thực tế trên bộ "Algebra Fundamentals"). Bộ Tiếng
      Trung/Anh không dính vì mặt sau là chữ thường.
- [x] **Fix**: xét "có nội dung" bằng `_fcCardHasContent` (mặt sau có ký tự bất kỳ) thay vì chữ thuần;
      khoá chống trùng `_learnChoiceKey` dùng chữ thuần, rỗng thì so theo chính chuỗi HTML chuẩn hoá.
- [x] **Luôn đủ 4 ô** kể cả bộ ít thẻ: thiếu nhiễu → **mượn thẻ từ bộ khác** (`_learnBorrowDistractors`,
      **ưu tiên bộ CÙNG MÔN** để nhiễu còn hợp lý, id dạng chuỗi `x<deck>_<card>` nên không bao giờ
      trùng id số của đáp án đúng) → vẫn thiếu thì thêm **ô giữ chỗ** `.learn-filler`.
      `_learnModeFor` bỏ điều kiện `poolSize >= 2` (box 0 giờ LUÔN trắc nghiệm được).
- [x] **Xáo vị trí đáp án đúng** trong 4 ô — đã có `_fcShuffle` cuối hàm, verify rải đều vị trí 1→4.
- [x] **Fix kèm — thẻ Toán bị hỏi TỰ LUẬN vô nghĩa**: `\(x = 2\) or \(x = 3\)` lột LaTeX chỉ còn chữ
      **"or"** → `_learnTypeable` tưởng gõ được → bắt học sinh gõ "or" (gần như luôn sai). Thêm
      `_fcHasMath` → có LaTeX là ép trắc nghiệm. Bộ Toán giờ 100% trắc nghiệm; bộ chữ giữ nguyên
      luồng MC → Tự luận → Tự luận.
- Verify (live): bộ Toán 11 câu liên tiếp đều **4 ô**, vị trí đáp án đúng rải 1/2/3/4; bộ 2 thẻ → 4 ô
      (2 nhiễu mượn từ bộ Toán khác, 0 giữ chỗ); bộ 1 thẻ + không còn bộ nào khác → 4 ô (3 giữ chỗ);
      lưới đúng **2 cột × 2 hàng**, LaTeX render trong ô (5 `mjx-container`), phím tắt 1–4 đủ; chạy trọn
      buổi Math 18 lượt + English 18 lượt → thuộc hết, Leitner không đổi.

### 2) TTS đọc đúng tiếng (không còn rơi hết về giọng Anh)
- [x] **Chuẩn hoá mã ngôn ngữ** (`_fcNormLang`/`_fcLangBase`/`_fcLangRegion`/`_fcLangScript`): trình
      duyệt báo `voice.lang` rất lộn xộn — `zh_TW` (gạch dưới, Android), **`cmn-Hans-CN`** (giọng Quan
      thoại của Google), **`yue-HK`** (Quảng Đông), `zh-Hant-TW` (có subtag hệ chữ). So khớp thô kiểu cũ
      (`split('-')[0]`) **TRƯỢT hết** các dạng này → không gán được giọng → đọc bằng giọng mặc định
      (tiếng Anh). Nay `cmn`/`yue` đều quy về `zh`, bỏ subtag hệ chữ khi lấy mã vùng.
- [x] **Thang điểm tổng hợp thay vì lọc cứng** (`_fcVoiceLangScore` + `_fcPickVoice`): xếp hạng
      `ngôn ngữ/vùng/hệ chữ (×10) > đúng giới tính (+25) > chất lượng giọng`. **Vì sao đổi**: bản trước
      lọc cứng theo giới tính TRƯỚC → xin `zh-HK` giọng nữ mà máy có giọng Quảng Đông HK (không đoán
      được giới tính) + giọng nữ Đài Loan thì chọn **giọng Đài Loan → sai vùng tiếng**. Giờ đọc đúng
      tiếng luôn thắng; giới tính chỉ phân định khi ngang ngôn ngữ.
- [x] **Chờ giọng nạp xong mới đọc** (`_fcEnsureVoices` + flush trong `onvoiceschanged`, timeout 1.2s):
      Chrome nạp `getVoices()` **bất đồng bộ** — câu ĐẦU TIÊN sau khi tải trang thường gặp danh sách
      rỗng → không gán được giọng đúng → đọc giọng mặc định. Có giọng sẵn thì gọi lại NGAY (đồng bộ,
      không làm trễ luồng thường).
- [x] **Chặn `lang='auto'` lọt vào `utterance.lang`** (không phải mã hợp lệ → trình duyệt rơi về giọng
      mặc định): `_fcSpeakNow` tự nhận diện khi lang rỗng/'auto'.
- [x] **Báo trung thực khi máy thiếu giọng** (`_fcWarnMissingVoice`, 1 lần/ngôn ngữ/phiên): máy KHÔNG
      cài voice pack cho ngôn ngữ đó thì trình duyệt chắc chắn đọc bằng giọng mặc định — đây là giới hạn
      HĐH/trình duyệt, KHÔNG phải lỗi app. Thay vì im lặng đọc sai tiếng, hiện toast hướng dẫn cài giọng.
- Verify (live): `utterance.lang` gán đúng từng thẻ (zh-TW/zh-CN/vi-VN/ja-JP); với giọng giả lập đầy đủ →
      `zh-TW♀`→HsiaoChen(zh-TW) **không** lấy nhầm Xiaoxiao(zh-CN), `zh-TW♂`→Yunjun (mã `zh_TW` gạch dưới
      vẫn khớp), `zh-HK`→giọng Quảng Đông HK (đúng vùng), `vi-VN♀/♂`→HoaiMy/NamMinh; giọng THẬT của máy
      → Zira♀(pitch 1.08)/David♂(0.88), rate 0.92; `'auto'` → tự nhận diện ra `ja-JP`/`vi-VN`; thiếu giọng
      Nhật → hiện đúng 1 cảnh báo. `tsc --noEmit` sạch, `node --check` pass, 0 lỗi console.
- **⚠️ Lưu ý môi trường**: máy dev chỉ cài 3 giọng Windows tiếng Anh (David/Mark/Zira) nên phần khớp
      giọng đa ngôn ngữ được kiểm bằng danh sách giọng giả lập đúng quy ước đặt tên thật của
      Microsoft/Google. Muốn nghe đúng tiếng Việt/Trung/Nhật/Hàn, máy người dùng **phải cài voice pack**
      tương ứng (Windows: Cài đặt → Thời gian & Ngôn ngữ → Giọng nói) hoặc dùng Edge (có giọng Online).

## Flashcard TTS v4: bảng mapping giọng theo ngôn ngữ + tinh chỉnh pitch/rate ✅ ĐÃ LÀM
- [x] **Bảng tên giọng Nữ/Nam theo TỪNG ngôn ngữ** (`FC_VOICE_FEMALE_NAMES`/`FC_VOICE_MALE_NAMES`, thay
      2 regex gộp cũ): vi-VN (HoaiMy♀/NamMinh♂), zh-CN (Xiaoxiao♀/Yunjian,Yunxi♂), zh-HK (HiuGaai,
      HiuMaan♀/WanLung♂), zh-TW (HsiaoChen♀/Yunjun♂), en (Jenny/Aria/Zira♀/Guy/David/Ryan♂), ja-JP
      (Nanami/Keiko♀/Keita/Naoki♂), ko-KR (SunHi/Heami♀/InJoon♂) — khớp CHUỖI CON không phân biệt
      hoa/thường (`indexOf`, không cần regex phức tạp). Dropdown ngôn ngữ trong modal thẻ (`FC_TTS_LANGS`)
      giờ HIỆN LUÔN mapping này trong nhãn (vd "Tiếng Việt — vi-VN · ♀HoaiMy ♂NamMinh") để GV biết trước
      máy học sinh có thể phát giọng gì.
- [x] **Sửa 1 lỗi phân loại giới tính**: yêu cầu gốc gộp "HoaiMy / NamMinh" cùng vào nhóm "Nữ" cho
      tiếng Việt, nhưng thực tế `NamMinh` là giọng **Nam** (Microsoft/Edge Neural chính thức, HoaiMy mới
      là Nữ). Đã phân loại đúng theo thực tế — nếu không, cơ chế xen kẽ Nam/Nữ sẽ chọn nhầm cả 2 giọng
      Việt là "nữ" và không bao giờ đan xen đúng khi có đúng 2 giọng này trên máy.
- [x] **Dọn logic cũ kém tin cậy**: bỏ hẳn `\bnữ\b`/`\bnam\b` (word-boundary Unicode với `ữ` không hoạt
      động đúng trong JS regex vì `\w` chỉ tính ASCII — về lý thuyết gần như không bao giờ khớp được vế
      sau `ữ`) — thay bằng bảng tên tường minh (đã có `hoaimy`/`namminh` nên không cần dò chữ Việt
      chung nữa) + giữ `\bfemale\b`/`\bmale\b` (an toàn với ASCII).
- [x] **Tinh chỉnh pitch/rate về ĐIỂM GIỮA khoảng** (thay vì biên cũ 0.9/1.1/0.95): `rate=0.92` (khoảng
      0.90–0.95), `pitch` Nữ `1.08` (khoảng 1.05–1.10) / Nam `0.88` (khoảng 0.85–0.90) — điểm giữa nghe
      tự nhiên hơn giá trị ở biên.
- Verify (live): 25/25 ca tên giọng (đủ 7 ngôn ngữ + biến thể chung "Female"/"Male") phân loại đúng,
      gồm xác nhận `HoaiMy→female`, `NamMinh→male`; đan xen David(0.88)→Zira(1.08)→David→Zira trên máy
      thật, rate luôn 0.92; mặt sau vẫn im lặng (quy tắc cũ không đổi); Learn Mode chạy trọn buổi 4 thẻ
      → thuộc hết (Leitner không đổi); dropdown modal thẻ hiện đúng nhãn mapping cho vi/zh-CN/zh-HK.
      `tsc --noEmit` sạch, `node --check` pass, 0 lỗi console.

## Flashcard TTS v3: giọng chất lượng cao + xen kẽ/cố định Nam-Nữ ✅ ĐÃ LÀM
- [x] **Ưu tiên giọng chất lượng cao** (`_fcVoiceQuality`): xếp hạng giọng có tên chứa "Natural"/
      "Neural" (+4) hay "Online"/"Google" (+2) lên trên giọng robot mặc định của hệ điều hành, trong
      nhóm giọng ĐÃ khớp ngôn ngữ. Không có giọng chất lượng cao → vẫn chọn giọng tốt nhất hiện có
      (không lỗi) — máy test chỉ có 3 giọng Windows thường (David/Mark/Zira), không có giọng Natural.
- [x] **Xen kẽ Nam/Nữ giữa các thẻ MỚI** (`_fcResolveGender`, mặc định "🔀 Xen kẽ"): mỗi khi sang MỘT
      THẺ KHÁC (không phải lật đi lật lại đúng thẻ đang xem) → đổi giọng. Đoán giới tính giọng qua TÊN
      (`_fcVoiceGender`: khớp "Female"/"Male"/"Nữ"/"Nam" hoặc các tên riêng thường gặp — Zira/Hazel/
      Aria… = nữ, David/Mark/Guy/Ryan… = nam). Trong nhóm đúng giới tính, vẫn ưu tiên chất lượng cao nhất.
- [x] **Cho chọn CỐ ĐỊNH 1 giọng** — dropdown mới `fcVoiceGenderSelectHtml()` (🔀 Xen kẽ / ♀️ Nữ / ♂️ Nam),
      đặt cạnh nút "Tự phát âm" ở CẢ 2 nơi: thanh công cụ màn Học thẻ và header Chế độ Học. Lưu
      `th_fc_voice_gender` theo tài khoản; chọn cố định thì KHÔNG xen kẽ nữa.
- [x] **Tinh chỉnh pitch/rate**: Nam `pitch=0.9`, Nữ `pitch=1.1`, `rate=0.95` cho mọi lượt đọc (đúng
      thông số yêu cầu) — nghe tự nhiên hơn giọng mặc định pitch=1 phẳng.
- [x] **Fallback không lỗi app**: `_fcPickVoice` không tìm được giọng đúng ngôn ngữ → trả `null`, browser
      tự dùng giọng chuẩn theo `utterance.lang`; không tìm được giọng đúng GIỚI TÍNH trong ngôn ngữ đó →
      bỏ qua tiêu chí giới tính, vẫn chọn giọng chất lượng cao nhất có sẵn (không báo lỗi, không im lặng).
      **Bug bắt được khi test**: gán `u.voice` cho object giọng "hỏng"/không đúng kiểu (một số trình
      duyệt/thiết bị có thể trả voice không hợp lệ) làm `speechSynthesis.speak()` KHÔNG BAO GIỜ được gọi
      (lỗi rơi ra ngoài, mất tiếng hoàn toàn) — đã tách riêng try/catch cho bước gán voice, lỗi ở đây chỉ
      bỏ qua voice tuỳ chỉnh (rơi về giọng chuẩn theo `lang`) mà KHÔNG làm mất câu đọc.
- Verify (live): mock giọng có Natural → chọn đúng giọng Natural chất lượng cao nhất theo cả ngôn ngữ +
      giới tính (en-US nữ→Aria Natural, nam→Guy Natural, ja-JP nữ→Nanami Natural); không có giọng khớp
      giới tính → fallback chọn chất lượng cao nhất, không lỗi; giọng "hỏng" → vẫn đọc được (voice=null,
      pitch/rate đúng); trên máy thật (3 giọng Windows) xen kẽ đúng Zira(1.1)→David(0.9)→Zira→David qua
      4 thẻ liên tiếp; lật lại đúng thẻ không đổi giọng; cố định Nữ/Nam → giữ nguyên pitch qua nhiều thẻ;
      Learn Mode câu hỏi (mặt trước) vẫn xen kẽ đúng, chạy trọn buổi 4 thẻ → 12 lượt → thuộc hết (không
      hỏng thuật toán Leitner); quy tắc "chỉ đọc mặt trước" vẫn đúng (lật sang sau → 0 lần đọc); dropdown
      giọng hiện đúng ở cả màn Học thẻ + Chế độ Học. `tsc --noEmit` sạch, `node --check` pass, 0 lỗi console.

## Flashcard TTS v2: chỉ đọc MẶT TRƯỚC + ngôn ngữ theo TỪNG THẺ (+ Trung phồn thể) ✅ ĐÃ LÀM
- [x] **CHỈ tự động đọc MẶT TRƯỚC** (27-flashcard-learn.js `fcOnFlip`): lật sang **mặt sau → IM LẶNG**
      (`fcStopSpeak()` để cắt luôn câu đang đọc dở). Lật ngược lại về mặt trước thì đọc lại. Mở thẻ /
      chuyển thẻ (đang hiện mặt trước) vẫn đọc. Muốn nghe mặt sau → bấm nút loa 🔊 thủ công (vẫn còn).
- [x] **Ngôn ngữ đặt LÚC TẠO/SỬA THẺ** (23-flashcards.js `openCardModal`): thêm ô **"🔊 Ngôn ngữ phát âm
      (mặt trước)"** — 14 lựa chọn, mặc định "🌐 Tự động nhận diện". `saveCard` lưu qua `fcSetCardLang`.
      **Thứ tự ưu tiên khi đọc**: ngôn ngữ của **THẺ** → ngôn ngữ của **BỘ THẺ** → tự nhận diện nội dung.
- [x] **Thêm Trung PHỒN THỂ**: `zh-TW` (Đài Loan) + `zh-HK` (Hồng Kông), cạnh `zh-CN` (giản thể). Mã
      BCP-47 truyền thẳng vào `utterance.lang` của Web Speech API. Danh sách đầy đủ: `auto, en-US, en-GB,
      vi-VN, ja-JP, ko-KR, zh-CN, zh-TW, zh-HK, fr-FR, de-DE, es-ES, ru-RU, th-TH`.
- [x] **Tự dò giản thể ↔ phồn thể** khi để "auto" (`_fcDetectChinese`): đếm chữ CHỈ CÓ ở một bên
      (這/这, 學/学, 國/国, 會/会…) — nhiều phồn thể hơn → `zh-TW`, còn lại → `zh-CN` (phổ biến hơn).
      Chữ dùng chung không đoán được → muốn chắc thì đặt ngôn ngữ cho thẻ.
- [x] **Lưu ngôn ngữ ĐI THEO THẺ** — migration **`028_flashcard_front_lang.sql`** (`flashcards.front_lang
      TEXT`): GV đặt 1 lần, **mọi HS mở thẻ đều đọc đúng giọng**. Client tự **dò cột** (`'front_lang' in c`
      ngay trên dữ liệu đã tải — 0 query thêm, không sinh 400); **CHƯA chạy 028 vẫn chạy bình thường**,
      tự fallback lưu `localStorage` theo máy (khoá theo **dbId** — id số trong RAM đổi mỗi lần tải nên
      không dùng làm khoá được).
- [x] **Learn Mode không bị ảnh hưởng**: câu hỏi CHÍNH LÀ mặt trước nên vẫn được đọc (đúng quy tắc, dùng
      mã lang của thẻ); **bỏ tự đọc đáp án** sau khi trả lời (đáp án = mặt sau) — nút loa trong khối phản
      hồi vẫn còn để nghe thủ công. Thuật toán Leitner/trắc nghiệm/tự luận/tiến trình giữ nguyên 100%.
      `lang` của ô nhập tự luận đổi sang ngôn ngữ **đáp án** (gợi ý bàn phím/IME đúng hơn).
- Verify (live): mở thẻ→đọc mặt trước / lật sang mặt sau→**0 lần đọc** / lật lại→đọc lại / thẻ mới→đọc;
      4 ca nhận diện Trung (giản, phồn, chữ chung, hỗn hợp) đúng; modal có 14 lựa chọn + 2 mục phồn thể,
      thẻ mới mặc định `auto`; lưu `zh-TW`/`zh-HK` → phát đúng mã; ưu tiên **thẻ > bộ thẻ > tự nhận diện**
      đúng cả 4 nhánh; localStorage lưu đúng `{"<dbId>":"zh-TW"}`; Learn Mode đọc câu hỏi (zh-TW) nhưng
      **KHÔNG đọc đáp án**, chạy trọn buổi 4 thẻ → 12 lượt → thuộc hết, box→dạng câu hỏi đúng; tắt toggle
      → 0 lần đọc. `node --check` 3 module + `tsc --noEmit` sạch, **0 lỗi console**.
- **⚠️ Việc thủ công (tuỳ chọn)**: chạy `028_flashcard_front_lang.sql` trên Supabase để ngôn ngữ đi theo
      thẻ cho MỌI người dùng. Chưa chạy → vẫn dùng được nhưng cấu hình chỉ nằm trên máy đang dùng.

## Flashcard: Tự động phát âm (TTS) + Chế độ Học kiểu Quizlet ✅ ĐÃ LÀM
**Module MỚI `public/js/27-flashcard-learn.js`** (nạp sau 26-pomodoro, trước 25-init) — độc lập, tự có
helper localStorage/plain-text; 23-flashcards.js chỉ gọi 3 hook (`fcOnFlip`, `fcStudyToolsHtml`,
`startLearn`) + `_hideLearnView` → dễ gỡ/bảo trì, không đụng DB/RLS/auth.

### 1) Tự động phát âm khi lật thẻ (Web Speech API)
- [x] **Lật thẻ → tự đọc ĐÚNG mặt đang hiện** (`fcOnFlip` gọi từ `flipStudyCard`/`next`/`prevStudyCard`/
      `startStudy`): mặt trước đọc mặt trước, lật sang mặt sau đọc mặt sau.
- [x] **Tự nhận diện ngôn ngữ theo NỘI DUNG** (`fcDetectLang`): kana→`ja-JP`, hangul→`ko-KR`, Hán tự→
      `zh-CN`, Thái→`th-TH`, Cyrillic→`ru-RU`, Ả Rập→`ar-SA`, Việt→`vi-VN`, Đức/TBN/Pháp, mặc định `en-US`.
      ⚠️ Chốt kỹ thuật: tiếng Việt chỉ nhận qua **ký tự RIÊNG** (dải U+1EA0–U+1EF9 + ăđơư) — KHÔNG dùng
      nguyên âm dấu dùng chung (à á è é ó ú) vì Pháp/TBN cũng có → bản đầu "très"/"estás" bị nhận nhầm
      là tiếng Việt, đã sửa và test lại 13 ngôn ngữ đều đúng.
- [x] **Cấu hình ngôn ngữ THEO TỪNG BỘ THẺ** (dropdown 11 ngôn ngữ trong header màn Học, lưu
      `th_fc_lang_<deckId>` theo tài khoản): chọn cụ thể thì ưu tiên hơn tự nhận diện; để "🌐 Tự động"
      thì dò theo nội dung. Chọn giọng khớp `lang` từ `speechSynthesis.getVoices()` (cache + nghe
      `voiceschanged` vì Chrome nạp giọng bất đồng bộ).
- [x] **Nút bật/tắt "🔊 Tự phát âm"** (`toggleFcAutoSpeak`, lưu `th_fc_autospeak` theo tài khoản, mặc
      định BẬT) + nút loa 🔊 trên từng mặt thẻ để đọc thủ công bất cứ lúc nào.
- [x] **KHÔNG đọc rác**: `_fcPlainText` lột thẻ HTML (`<img>` từ tính năng nhận diện toán học) và LaTeX
      trước khi đọc — nếu không máy sẽ đọc "backslash frac a b". Mặt chỉ có hình/công thức → im lặng.
      Tự huỷ câu đang đọc trước khi đọc câu mới (không chồng tiếng); thoát màn Học thì ngắt tiếng.
- Verify (live): 13/13 ca nhận diện đúng (en/vi×3/ja/ko/zh/ru/th/fr/de/es + LaTeX); lật thẻ đọc đúng
      mặt + đúng `lang`; override bộ thẻ (ja-JP) thắng tự nhận diện; tắt toggle → 0 lần đọc; mặt chỉ có
      LaTeX+ảnh → 0 lần đọc; trạng thái lưu đúng localStorage.

### 2) Chế độ Học (Learn) — Quizlet-style
- [x] **Thuật toán Leitner** (spaced repetition đơn giản, box 0→3): **box 0 = Trắc nghiệm** (làm quen),
      **box 1–2 = Tự luận** (gõ lại — nhớ chủ động), **box ≥3 = ĐÃ THUỘC** rời hàng chờ. Đúng → box+1;
      **Sai → box về 0 + chèn lại vào hàng chờ cách 3 thẻ** → từ sai lặp lại tới khi thuộc hoàn toàn.
      Box lưu `th_fc_learn_<deckId>` theo tài khoản → **đóng trình duyệt mở lại vẫn nhớ tiến độ**.
- [x] **Trắc nghiệm**: 4 phương án, nhiễu lấy từ mặt sau các thẻ khác (lọc trùng); phím tắt **1–4**.
- [x] **Tự luận**: so khớp "thông minh" — bỏ qua hoa/thường, khoảng trắng thừa, dấu câu; chấp nhận
      **nhiều đáp án** ngăn bởi `/` hoặc `;`; bỏ phần trong ngoặc; **tha lỗi gõ nhầm 1 ký tự**
      (Levenshtein ≤1, đáp án ≥4 ký tự) → báo "Gần đúng — chú ý chính tả". Nút **"Tôi chưa biết"**.
      ⚠️ Thẻ có đáp án là **ảnh/công thức/quá dài (>60 ký tự)** → tự ép về Trắc nghiệm (không thể gõ).
- [x] **Sai → hiện NGAY đáp án đúng** (khối đỏ + tô sáng phương án đúng + khoá các nút) kèm ví dụ và
      dòng nhắc "Thẻ này sẽ xuất hiện lại…"; đúng thì khối xanh. Bật TTS thì tự đọc đáp án đúng.
- [x] **Thanh tiến trình**: 2 dải màu (đã thuộc / đang học) + 4 chip đếm **Đã thuộc / Đang học / Chưa
      học / Tổng**, có `role="progressbar"` + `aria-valuenow`. Màn hoàn thành hiện Đúng/Sai/độ chính xác
      + `celebrate()` (confetti) + nút **Học lại từ đầu** (`learnResetProgress`).
- [x] **Vào từ**: nút **"🧠 Chế độ Học"** cạnh "🎯 Học ngay" trong trang chi tiết bộ thẻ. Thoát bằng nút
      hoặc **Esc**; **Enter** = nộp/tiếp. Gỡ listener bàn phím + ngắt tiếng khi thoát (không rò rỉ).
- Verify (live, mock): chạy trọn 1 buổi học 5 thẻ → 15 lượt đúng (mỗi thẻ 1 MC + 2 tự luận) → 5/5 thuộc,
      thanh 100%, màn hoàn thành đúng số liệu; mapping box→dạng câu hỏi đúng {0:mc, 1:written, 2:written};
      trả lời SAI → hiện đáp án đúng + box về 0 + chèn lại đúng vị trí 3 + hàng chờ giữ nguyên độ dài;
      10/10 ca so khớp tự luận đúng (kể cả sai dấu tiếng Việt = SAI, gõ thiếu 1 ký tự = gần đúng);
      4/4 ca ép Trắc nghiệm (ảnh/LaTeX/quá dài); mở lại khi đã thuộc hết → vào thẳng màn hoàn thành;
      Đặt lại → xoá box, quay lại câu hỏi; phím 1–4/Enter/Esc chạy đúng; thoát dọn sạch state.
- **Fix khi tự review**: `.learn-card` ban đầu dùng `var(--card)` — biến này KHÔNG tồn tại trong dự án
      (đúng tên là `--card-bg`) → thẻ bị trong suốt. Đã sửa + thêm `box-shadow: var(--shadow)`; kiểm tra
      lại light/dark đều đúng nền (trắng / #1a2235), mobile 375px 1 cột, nút 44px, input 16px (không bị
      iOS tự phóng to), không tràn ngang. `tsc --noEmit` sạch, `node --check` pass, **0 lỗi console**.

## Nhạc YouTube Music (bài + album) + SoundCloud album + gỡ Spotify ✅ ĐÃ LÀM
- [x] **Thêm YouTube Music** (26-pomodoro.js `_parseMusicUrl`): nhận link `music.youtube.com` —
      **bài lẻ** (`watch?v=`) và **album/playlist** (`playlist?list=OLAK5uy_…` hoặc `list=`). Provider
      mới `ytmusic` (nhãn "YouTube Music"). Cả YouTube thường lẫn YT Music phát qua **IFrame API**;
      bài lẻ → `loadVideoById`, album → `loadPlaylist({list,listType:'playlist'})` (tự phát lần lượt,
      hết playlist thì `pomoMusicNext`).
- [x] **Nhận ALBUM** cho SoundCloud + YT Music: SoundCloud giờ **CHỈ nhận album (set)** — link phải có
      `/sets/` (track lẻ bị từ chối, đúng music_rules "SoundCloud: Albums ONLY"); YT Music nhận cả bài
      lẫn album. Track có `kind:'track'|'album'`; hàng chờ hiện marker 💿 + nhãn "· Album".
- [x] **Gỡ Spotify**: `_parseMusicUrl` không còn nhận link Spotify; `_pomoTracks()` tự **lọc bỏ track
      Spotify cũ** trong hàng chờ (localStorage) khi tải; `_pomoEmbedSrc` bỏ nhánh spotify; placeholder/
      empty-state cập nhật (chỉ YouTube / YouTube Music / SoundCloud). **CSP** (`next.config.ts`) gỡ
      `open.spotify.com` khỏi `connect-src`/`frame-src`. ⚠️ Cần Vercel redeploy để CSP mới có hiệu lực.
- [x] **Fix bug tiềm ẩn**: track YouTube mới lưu id ở `ref` nhưng `_pomoPlayCurrent` cũ đọc `track.videoId`
      (undefined) → không phát. Nay dùng `track.ref || track.videoId` (tương thích track cũ).
- Verify (live, mock mode): parser đúng 9 ca (YT Music bài/album, YT thường, youtu.be, playlist, SC album,
      SC track bị loại, Spotify bị loại, rác bị loại); track Spotify cũ trong queue bị lọc + track YT cũ
      (videoId-only) migrate sang `provider:youtube,kind:track,ref`; UI render player YT + hàng chờ có
      marker Album 💿, không còn chữ "spotify" trong DOM; 0 lỗi console.

## Flashcard: nhận diện toán học (ảnh công thức → LaTeX) + chèn ảnh hình học ✅ ĐÃ LÀM (OCR cần setup)
- [x] **2 nút trên mỗi ô Mặt trước/Mặt sau** (23-flashcards.js `_fcMathBar` trong `openCardModal`):
      **🧮 Nhận diện công thức** (ảnh → LaTeX) và **🖼️ Chèn ảnh** (hình học/sơ đồ). Dùng chung 1 input
      file ẩn (`fcImgInput`) + state `_fcImgTarget/_fcImgMode`. Ô front/back vốn render RAW HTML nên
      chèn `<img class="fc-img">` / LaTeX hiển thị ngay (MathJax v3 đã có sẵn qua jsdelivr).
- [x] **Nén ảnh phía client** (`_fcCompressImage`, canvas): downscale (attach 1000px / OCR 1400px), nền
      trắng cho ảnh trong suốt, xuất JPEG q0.82 → data URL + Blob. Verify live: 2000×1200 → 1000×600, ~5KB.
- [x] **Chèn ảnh** (`_fcAttachImage`): có DB → upload Supabase Storage bucket `materials`
      (`flashcards/<uid>/…jpg`) rồi chèn public URL (không phình DB); lỗi/không DB → nhúng data URL. CSS
      `.fc-img` (max-height 240px, responsive) + `.fc-mathbar`.
- [x] **OCR công thức** (`_fcOcrImage` → `POST /api/math-ocr`): API route same-origin
      (`app/api/math-ocr/route.ts`) gọi **Mathpix** với key ở ENV server (KHÔNG lộ client — giống pattern
      Google Drive), chỉ cho user đã đăng nhập. Trả `{latex}` → chèn `\(…\)`/`\[…\]` vào ô. Chưa cấu hình
      env → **501 `not_configured`**, client báo rõ + **tạm chèn ảnh** (không mất công); lỗi/401 cũng
      degrade an toàn (luôn còn đường chèn ảnh + gõ LaTeX tay).
- Verify (live, mock mode): modal có 2 thanh × 2 nút + input file; `_fcInsertAtCursor`/`_fcInsertImg` chèn
      đúng; preview render ảnh (max-h 240px) + 2 công thức MathJax typeset; `tsc --noEmit` sạch; 0 lỗi console.
- **⚠️ CẦN BẠN LÀM để bật OCR** (tuỳ chọn — chèn ảnh + gõ LaTeX vẫn chạy nếu bỏ qua):
  1. Tạo tài khoản **Mathpix OCR API** (https://mathpix.com/ocr-api), lấy `app_id` + `app_key`.
  2. Vercel → project → Settings → Environment Variables → thêm `MATHPIX_APP_ID`, `MATHPIX_APP_KEY` → redeploy.
  3. Vào app (qua `/dashboard` để có phiên đăng nhập) → Flashcard → Thêm/Sửa thẻ → 🧮 Nhận diện công thức.
- **Chưa test được OCR end-to-end** ở môi trường này: `/api/math-ocr` nằm sau middleware auth (mock mode
      không có phiên Supabase nên bị redirect `/login`) + chưa có key Mathpix. Cần bạn làm bước 1-2 rồi thử
      bước 3 với tài khoản thật, báo lại nếu lỗi.

## Tích hợp Google Drive: file nặng (PDF/Word...) lưu vào Drive của GV ⚠️ CẦN SETUP THỦ CÔNG
- [x] **Đã kiểm chứng: service account KHÔNG dùng được** với Gmail cá nhân — test thật với key
      `tutorhub-uploader@tutorhub-502013.iam.gserviceaccount.com` cho lỗi cứng `"Service Accounts do
      not have storage quota"` dù đã bật Drive API + share thư mục cho service account. Đây là giới hạn
      kiến trúc của Google (chỉ né được bằng Shared Drive — tính năng Google Workspace, không có ở Gmail
      thường). → Đã chuyển sang **OAuth delegation**: GV tự kết nối Drive CỦA HỌ, upload dùng quota
      cá nhân (không cần secret nào lộ ra client, không cần service-role key ở Supabase).
- [x] **Migration** `027_google_drive_tokens.sql`: bảng lưu refresh/access token theo từng GV, RLS
      owner-only (giống mọi bảng khác trong dự án — không cần service-role key).
- [x] **`lib/google-drive.ts`**: helper trao đổi/làm mới token, tự tạo thư mục "TutorHub Uploads" trong
      Drive của GV, mở phiên **resumable upload**, cấp quyền "ai có link đều xem", xoá file.
- [x] **API routes** (`app/api/google-drive/*`): `connect` (mở màn hình xin quyền Google — bắt buộc
      thoát ra khỏi iframe bằng `window.top.location`), `callback` (đổi code lấy token, lưu DB), `disconnect`
      (thu hồi + xoá token), `upload-init` (mở phiên resumable, **client PUT thẳng lên Google — KHÔNG
      qua server mình**, né giới hạn kích thước request-body ~4.5MB của Vercel serverless — quan trọng
      với file nặng), `publish-file` (công khai link), `delete-file`.
- [x] **Materials tích hợp** (24-materials.js): `saveMaterial` tự kiểm tra đã kết nối Drive chưa
      (`_checkDriveConnected`) → có thì upload qua Drive (nút Save hiện "⏳ Đang tải lên Drive... N%"
      theo `xhr.upload.onprogress`), lỗi Drive thì tự fallback về Supabase Storage (không làm hỏng
      luồng upload cũ); chưa kết nối thì y hệt hành vi cũ. `deleteMaterial` xoá đúng nơi (Drive hay
      Supabase) dựa vào marker `gdrive:<fileId>` lưu trong `file_path`. `renderMaterials` hiện tài liệu
      Drive như link ngoài ("📂 Mở trên Google Drive", `target=_blank`, KHÔNG gắn `download` — thuộc
      tính này bị trình duyệt bỏ qua với URL khác gốc và sẽ điều hướng cả tab ra khỏi app nếu dùng nhầm).
- [x] **Cài đặt**: card "Google Drive" (`renderDriveSettings`, hook vào `renderSettings()` có sẵn) —
      nút Kết nối/Ngắt kết nối, hiện email Drive đã kết nối.
- **Bug đã bắt & sửa khi tự review code** (chưa test được vì môi trường này không có Chrome để đăng
      nhập Google thật): sửa tài liệu KHÔNG chọn tệp mới thì `resolvedPath` phải giữ nguyên `file_path`
      cũ (trước đó bị reset về rỗng) — nếu không, tài liệu Drive bị sửa tên/mô tả sẽ mất marker
      `gdrive:`, khiến lần sau tưởng nhầm là tệp Supabase (gắn `download` sai + xoá không dọn được file
      trên Drive).
- **⚠️ CẦN BẠN LÀM (không tự động được — cần đăng nhập Google Cloud Console thật)**:
  1. [x] ✅ Đã chạy `027_google_drive_tokens.sql` trên Supabase SQL Editor.
  2. Google Cloud Console (project `tutorhub-502013`) → APIs & Services → **OAuth consent screen**:
     loại **External**, thêm scope `.../auth/drive.file`, thêm chính email Google của bạn vào **Test
     users** (app ở chế độ Testing, chỉ test user mới đăng nhập được).
  3. **Credentials** → **Create OAuth client ID** → Web application → Authorized redirect URI:
     `https://studyweb-swart.vercel.app/api/google-drive/callback`. Lấy Client ID + Client Secret.
  4. Vào **Vercel** → project → Settings → Environment Variables → thêm `GOOGLE_CLIENT_ID` và
     `GOOGLE_CLIENT_SECRET` (giá trị lấy ở bước 3) → redeploy.
  5. Vào app → Cài đặt → bấm "🔗 Kết nối Google Drive" → đăng nhập Google → thử up 1 tài liệu PDF/Word.
- **Chưa test end-to-end được** (môi trường làm việc không có Chrome/đăng nhập Google thật) — đã
      `tsc --noEmit` + `node --check` sạch, review code kỹ 2 lượt, nhưng luồng OAuth thật (bước 5) cần
      bạn tự thử sau khi hoàn tất bước 2-4, báo lại nếu lỗi để tôi sửa tiếp.

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
- [x] **Việc thủ công**: ✅ Đã chạy `026_assignment_folders.sql` trên Supabase (2026-08-01) — thư mục
      nộp bài đã bật, cột `folders`/`folder_id` đã tồn tại (cờ `_asnFoldersReady` tự nhận đúng).
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
- [x] **Classes kiểu Moodle (weeks + feed nộp bài giống Facebook)** ✅ ĐÃ LÀM (✅ đã chạy migration `025`):
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
- [x] ✅ **Đã chạy TẤT CẢ migration `017`→`027` trên Supabase (xác nhận 2026-08-01)** — `017_notifications`,
      `018_find_account_by_name`, `019_realtime_notifications`, `020_audit_log`, `021_reminders`,
      `022_secure_notifications_insert`, `023_fix_signup_trigger`, `024_admin_list_all_users`,
      `025_class_term_weeks`, `026_assignment_folders`, `027_google_drive_tokens`. Mọi tính năng phụ
      thuộc migration ở các mục trên (nhật ký, nhắc, tra tên, kỳ học theo tuần, thư mục nộp bài, Drive)
      giờ chạy đầy đủ, không còn ở trạng thái fallback/báo lỗi thiếu cột/RPC.
      ⚠️ Nếu sau này chạy LẠI `017` (nó tạo lại policy INSERT rộng của `notifications`) thì phải chạy
      lại `022` để siết RLS lại.
  - [ ] Nếu trước đó nút "Nhật ký" từng báo lỗi (cờ `_auditOff`/`th_audit_off` lưu trong localStorage do
        404 lần đầu khi `020` chưa chạy): mở Console gõ `thAuditReset()` để bật lại ghi log — cờ cũ
        không tự hết dù migration đã chạy.
- [ ] Auth → URL Configuration: Redirect URLs có `https://studyweb-swart.vercel.app/**`;
      **Site URL** đúng domain prod (đây là nơi bị đá về khi redirect sai — lý do reset MK "không thấy lỗi gì").
- [ ] Kiểm tra email recovery/confirm có về không (cả Spam); SMTP mặc định Supabase bị giới hạn rate.
- [ ] Sau khi push: chờ Vercel build xong rồi test lại reset password.

## Ổn định cho người dùng THẬT (roadmap — làm tiếp)
> Mục tiêu: đủ tin cậy cho học sinh + giáo viên thật dùng. Trọng tâm là BỊT CHỖ DỄ VỠ,
> không phải thêm tính năng. Sắp theo mức ưu tiên.

### P0 — Đang chặn người dùng thật (cấu hình + lỗ hổng, phần lớn KHÔNG cần code)
- [x] ✅ **Migration `017`→`027` đã chạy hết** (xem mục "Việc thủ công" ở trên). Còn lại của mục này:
      **Auth URL config** (Site URL/Redirect URLs đúng domain prod) — CHƯA làm.
- [ ] **Email deliverability**: cắm **Custom SMTP** (Resend/SendGrid free) trong Auth → SMTP. SMTP mặc
      định Supabase giới hạn rate → đăng ký đông thì email xác nhận rớt âm thầm. (Tuỳ chọn: tạm tắt
      "Confirm email" lúc đầu để giảm ma sát, bật lại khi có SMTP.)
- [x] **Bịt lỗ hổng chèn notifications** ✅ CODE XONG + ✅ migration `022` đã chạy: migration
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
> Code đã sẵn sàng; migration `023`/`024` ✅ ĐÃ CHẠY (xác nhận 2026-08-01). Còn lại cần MÔI TRƯỜNG THẬT
> của bạn: cấu hình SMTP, tài khoản admin — chạy theo runbook dưới. Trạng thái: ✅ code-verified / ⏳ chờ bạn thao tác.
- [x] **Lỗi "Database error saving new user" khi đăng ký** — ĐÃ FIX (migration `023_fix_signup_trigger.sql`:
      `handle_new_user()` bọc EXCEPTION nên không bao giờ 500; + `dashboard/page.tsx` tạo profile bù
      nếu thiếu). ✅ Đã chạy `023` trên prod — có thể thử đăng ký lại.
- [x] **Admin không thấy tài khoản chờ duyệt trong "Quản lý người dùng"** — ĐÃ FIX. Nguyên nhân: mục
      này đọc bảng `profiles`; tài khoản mà trigger tạo profile lỗi → có trong `auth.users` nhưng thiếu
      profile → vô hình với admin. Fix: migration `024` (RPC `admin_list_users` join `auth.users` → thấy
      cả user chưa có profile; `admin_set_role` duyệt = tạo profile) + client `loadUsersFromDb`/
      `changeUserRole` gọi RPC (fallback đọc profiles nếu chưa chạy 024). ✅ Đã chạy `024`.
> **Đã tự động hoá phần UI** bằng e2e (mock mode): đăng nhập theo vai trò, điều hướng, thêm học sinh,
> phân quyền HS↔Admin. Các mục phụ thuộc SUPABASE thật (đăng ký/email/duyệt/RLS) vẫn cần bạn chạy tay.
- [ ] ⏳ Đăng ký mới → email xác nhận → đăng nhập → màn "chờ duyệt". (migration `023` ✅ đã chạy, còn
      thiếu SMTP; màn pending + gate Pending đã có sẵn trong `dashboard/page.tsx`.)
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
- **Migration cần chạy tay** (Supabase SQL Editor): `019`, `020`, `021` — ✅ đã chạy (xem mục "Việc thủ công").

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
