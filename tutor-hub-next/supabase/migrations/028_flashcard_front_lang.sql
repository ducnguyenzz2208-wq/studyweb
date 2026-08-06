-- 028_flashcard_front_lang.sql
-- Ngôn ngữ phát âm (TTS) của MẶT TRƯỚC từng thẻ, đặt lúc tạo/sửa thẻ.
-- Giá trị là mã BCP-47 dùng thẳng cho Web Speech API: 'en-US', 'ja-JP',
-- 'zh-CN' (Trung giản thể), 'zh-TW'/'zh-HK' (Trung phồn thể), 'vi-VN'…
-- NULL hoặc 'auto' = để app tự nhận diện theo nội dung mặt trước.
--
-- Cột này để NGÔN NGỮ ĐI THEO THẺ: giáo viên đặt 1 lần, mọi học sinh mở thẻ
-- đều đọc đúng giọng (nếu chỉ lưu localStorage thì mỗi máy một kiểu).
-- CHƯA chạy migration này app vẫn chạy bình thường: client tự dò cột
-- (`'front_lang' in row`) và fallback lưu localStorage theo từng máy.

ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS front_lang TEXT;

COMMENT ON COLUMN flashcards.front_lang IS
  'Mã ngôn ngữ BCP-47 để phát âm mặt trước (vd: en-US, ja-JP, zh-TW). NULL = tự nhận diện.';
