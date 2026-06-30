# Class Feed — Thiết kế "Lớp học kiểu Facebook"

**Ngày:** 2026-06-30
**Trạng thái:** Đã duyệt thiết kế tổng thể, chờ viết plan triển khai

## 1. Mục tiêu

Biến khu giao bài tập (section **Assignments**) trong `tutor-hub-next/public/tutor-hub-app.html`
thành một feed kiểu Facebook, gắn với từng lớp học:

- Giáo viên đăng bài tập như một bài post.
- Học sinh nộp bài bằng cách comment dưới post (kèm file).
- Sidebar trái: Môn học → bên trong là các Lớp (nested).
- **Chỉ thành viên của lớp** mới xem được nội dung lớp đó.
- Cả giáo viên và học sinh đều tải lên được PDF/PNG/JPG.

## 2. Phạm vi & Non-goals

**Trong phạm vi:**
- Bảng `class_members` + cơ chế giáo viên thêm/xóa học sinh khỏi lớp.
- Phân quyền (RLS) giới hạn nội dung theo thành viên lớp.
- Giao diện feed 2 cột (sidebar nested + post + luồng nộp bài inline).
- Upload file cho post (GV) và bài nộp (HS).

**Non-goals (để sau):**
- Realtime/đẩy thông báo khi có bài mới.
- Reaction (like/thả tim), reply lồng nhiều cấp.
- Đổi section Homework (giữ nguyên — đó là bảng theo dõi tiến độ riêng).

## 3. Quyết định đã chốt

- **Vào lớp:** Giáo viên thêm học sinh vào lớp (bảng `class_members`). 1 HS có thể ở nhiều lớp.
- **Hiển thị bài nộp (Phương án B):** Trong cùng một lớp, **mọi thành viên thấy bài nộp của nhau**
  (kiểu Facebook). Giáo viên thấy tất cả và chấm điểm.
- **Gộp comment = bài nộp:** Mỗi học sinh có 1 bài nộp/bài tập (lưu `assignment_submissions`,
  có thể sửa). Hiển thị như comment dưới post. Giáo viên chấm điểm/feedback hiện như reply.

## 4. Thay đổi dữ liệu (Supabase)

Migration mới: `tutor-hub-next/supabase/migrations/004_class_feed.sql`

### 4.1. Bảng `class_members`
```sql
CREATE TABLE IF NOT EXISTS class_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id   UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
```

### 4.2. Thêm `class_id` vào `assignments`
```sql
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
```
- Post mới gắn `class_id`. Cột `class` (tên lớp) giữ lại để hiển thị/tương thích ngược.

### 4.3. Helper kiểm tra thành viên (tránh đệ quy RLS)
```sql
CREATE OR REPLACE FUNCTION public.is_class_member(_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_members
    WHERE class_id = _class_id AND user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_class_member(UUID) TO authenticated;
```

### 4.4. RLS cho `class_members`
```sql
-- GV chủ lớp quản lý thành viên
CREATE POLICY "Owner manages class members" ON class_members FOR ALL
  USING     (EXISTS (SELECT 1 FROM classes c WHERE c.id = class_members.class_id AND c.owner_id = auth.uid()))
  WITH CHECK(EXISTS (SELECT 1 FROM classes c WHERE c.id = class_members.class_id AND c.owner_id = auth.uid()));

-- HS đọc được dòng thành viên của chính mình (để biết mình ở lớp nào)
CREATE POLICY "Member reads own membership" ON class_members FOR SELECT
  USING (user_id = auth.uid());
```

### 4.5. RLS `assignments` (thay chính sách "mọi HS đọc mọi bài")
```sql
DROP POLICY IF EXISTS "Students/Parents read assignments" ON assignments;
CREATE POLICY "Class members read assignments" ON assignments FOR SELECT
  USING (auth.uid() = owner_id OR public.is_class_member(class_id));
```

### 4.6. RLS `assignment_submissions` (Phương án B)
```sql
-- HS quản lý bài nộp của mình (giữ nguyên)
-- Thành viên lớp đọc MỌI bài nộp của bài tập trong lớp mình; GV chủ bài tập đọc hết
DROP POLICY IF EXISTS "Teacher/Admin read/grade all submissions" ON assignment_submissions;

CREATE POLICY "Class members read submissions" ON assignment_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND (a.owner_id = auth.uid() OR public.is_class_member(a.class_id))
  ));

-- GV chủ bài tập chấm điểm (update)
CREATE POLICY "Owner grades submissions" ON assignment_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_submissions.assignment_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_submissions.assignment_id AND a.owner_id = auth.uid()));
```

### 4.7. RPC thêm thành viên bằng email (không lộ danh sách hồ sơ)
Giáo viên không có quyền đọc hồ sơ học sinh khác. Dùng RPC SECURITY DEFINER:
```sql
CREATE OR REPLACE FUNCTION public.add_class_member(_class_id UUID, _email TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID;
BEGIN
  -- chỉ GV chủ lớp được thêm
  IF NOT EXISTS (SELECT 1 FROM classes WHERE id = _class_id AND owner_id = auth.uid()) THEN
    RETURN 'not_owner';
  END IF;
  SELECT id INTO _uid FROM auth.users WHERE email = lower(trim(_email)) LIMIT 1;
  IF _uid IS NULL THEN RETURN 'no_user'; END IF;
  INSERT INTO class_members (class_id, user_id) VALUES (_class_id, _uid)
    ON CONFLICT (class_id, user_id) DO NOTHING;
  RETURN 'ok';
END; $$;
GRANT EXECUTE ON FUNCTION public.add_class_member(UUID, TEXT) TO authenticated;
```

### 4.8. Storage
- Dùng lại bucket `materials` (public-read, auth-upload — đã tạo ở migration 002).
- Đường dẫn file: `assignments/<assignment_id>/<user_id>_<timestamp>_<tên>`.
- Lưu ý đánh đổi: bucket public → ai có URL đều xem được; chấp nhận trong phạm vi lớp/prototype.

## 5. Giao diện (trong `tutor-hub-app.html`, section Assignments)

### 5.1. Bố cục 2 cột
- **Cột trái (sidebar ~220px):** danh sách Môn học; mỗi môn mở ra các Lớp con (gấp/mở).
  - GV/Admin: hiện các lớp mình sở hữu (`classes` theo `owner_id`).
  - HS: chỉ hiện lớp mình là thành viên (`class_members`).
  - Mỗi lớp (GV) có nút **"Thành viên"**.
- **Cột phải (feed):** chọn 1 lớp → hiện các post của lớp đó.

### 5.2. Post (bài tập)
- Header: avatar + tên GV, môn · lớp · hạn nộp, badge trạng thái.
- Nội dung: tiêu đề, mô tả, file đính kèm (nếu có).
- GV: nút Sửa/Xóa post; nút "Đăng bài" ở đầu feed (chỉ GV).

### 5.3. Luồng nộp bài (inline, kiểu comment)
- Liệt kê các bài nộp dưới post (Phương án B: thấy của mọi người).
- Mỗi bài nộp: avatar + tên HS, nội dung text, file đính kèm, ngày nộp.
  - Nếu đã chấm: hiện điểm + feedback (như reply của GV).
  - HS: bài của mình có nút "Sửa bài nộp".
  - GV: nút "Chấm" trên mỗi bài nộp → nhập điểm/feedback.
- Ô nhập cuối post: "Viết bài nộp..." + nút đính kèm file + nút Gửi.
  - HS gửi → upsert `assignment_submissions` (mỗi HS 1 bài/bài tập).

### 5.4. Quản lý thành viên (GV)
- Modal "Thành viên lớp X": danh sách thành viên hiện tại (tên/email) + nút Xóa.
- Ô nhập email học sinh + nút Thêm → gọi RPC `add_class_member`.

## 6. Triển khai 2 giai đoạn

**Giai đoạn 1 — Dữ liệu & phân quyền:**
1. Viết migration `004_class_feed.sql` (mục 4).
2. Hàm JS load `class_members`, `add_class_member` RPC.
3. UI quản lý thành viên + sidebar nested.

**Giai đoạn 2 — Feed & upload:**
4. Render feed 2 cột thay cho list cũ.
5. Luồng nộp bài inline + upload file (post & bài nộp).
6. Chấm điểm inline.

Mỗi giai đoạn test xong mới sang giai đoạn sau. Migration phải chạy tay trên Supabase
SQL Editor (như các migration trước).

## 7. Rủi ro / Lưu ý

- **RLS đệ quy / auth.users:** đã tránh bằng helper `is_class_member` (SECURITY DEFINER)
  và RPC cho việc tra email — không đặt `SELECT FROM auth.users` trực tiếp trong policy
  (đây chính là lỗi 401 đã gặp ở migration 003).
- **Bài tập cũ** chưa có `class_id` → sẽ không hiện trong feed lớp cho tới khi gắn lớp.
  Cần script/để GV gán lại, hoặc chấp nhận bắt đầu mới.
- **File-heavy:** `tutor-hub-app.html` đã rất lớn; code feed mới cần gọn, tách hàm rõ ràng.
