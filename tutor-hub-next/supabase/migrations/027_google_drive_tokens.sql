-- 027_google_drive_tokens.sql
-- Lưu Google OAuth refresh token của TỪNG người dùng (GV) để upload file nặng
-- (PDF/Word/...) thẳng lên Drive CỦA HỌ (không phải service account — Gmail cá
-- nhân không có quota Drive cho service account, đã kiểm chứng thực tế).
-- RLS: mỗi người chỉ đọc/ghi được dòng của chính mình — theo đúng pattern các
-- bảng khác trong dự án (không cần service-role key, dùng session của user).

CREATE TABLE IF NOT EXISTS google_drive_tokens (
  user_id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token           TEXT NOT NULL,
  access_token            TEXT,
  access_token_expires_at TIMESTAMPTZ,
  drive_email             TEXT,
  drive_folder_id         TEXT,   -- id thư mục "TutorHub Uploads" tự tạo trong Drive của họ
  connected_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own drive token" ON google_drive_tokens;
CREATE POLICY "own drive token" ON google_drive_tokens FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
