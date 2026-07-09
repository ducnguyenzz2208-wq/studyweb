-- 026_assignment_folders.sql
-- Thư mục nộp bài do Giáo viên tạo trong từng Assignment (kiểu Moodle).
-- - assignments.folders: danh sách thư mục [{id, name}] (jsonb).
-- - assignment_submissions.folder_id: bài nộp thuộc thư mục nào ('' = mặc định/không thư mục).
-- Đổi ràng buộc duy nhất để mỗi học sinh nộp ĐƯỢC 1 bài / thư mục
-- (trước đây chỉ 1 bài / assignment).
--
-- An toàn: tất cả đều IF EXISTS/IF NOT EXISTS. Client tự phát hiện cột chưa có
-- và fallback về luồng cũ (1 bài / assignment) nên chạy trước migration vẫn OK.

-- 1) Cột folders trên assignments (GV cấu trúc sẵn các thư mục)
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS folders jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Cột folder_id trên bài nộp ('' = thư mục mặc định)
ALTER TABLE assignment_submissions
  ADD COLUMN IF NOT EXISTS folder_id text NOT NULL DEFAULT '';

-- 3) Đổi UNIQUE(assignment_id, student_id) -> UNIQUE(assignment_id, student_id, folder_id)
--    để 1 học sinh nộp được nhiều thư mục khác nhau trong cùng 1 bài.
ALTER TABLE assignment_submissions
  DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_student_id_key;

ALTER TABLE assignment_submissions
  DROP CONSTRAINT IF EXISTS assignment_submissions_asn_stu_folder_key;
ALTER TABLE assignment_submissions
  ADD  CONSTRAINT assignment_submissions_asn_stu_folder_key
  UNIQUE (assignment_id, student_id, folder_id);
