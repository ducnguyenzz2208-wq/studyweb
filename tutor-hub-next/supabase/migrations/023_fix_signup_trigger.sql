-- ============================================================
-- MIGRATION 023: Sửa lỗi "Database error saving new user" khi đăng ký
-- Nguyên nhân: trigger on_auth_user_created → handle_new_user() chèn vào
-- profiles bị lỗi (phiên bản cũ/khác trên prod) → GoTrue trả 500 và CHẶN
-- đăng ký. Sửa: định nghĩa lại handle_new_user() ĐÚNG + BỌC EXCEPTION để
-- lỗi tạo profile KHÔNG BAO GIỜ làm hỏng đăng ký (app tự tạo profile bù khi
-- vào /dashboard lần đầu). Idempotent — chạy lại được.
-- Run in: Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role   TEXT;
  _name   TEXT;
  _avatar TEXT;
BEGIN
  _role := CASE WHEN NEW.email = 'worldatwarduc@gmail.com' THEN 'Admin' ELSE 'Pending' END;
  _name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  _avatar := NULLIF(UPPER(LEFT(regexp_replace(COALESCE(_name, ''), '\s+', '', 'g'), 2)), '');

  -- Không để lỗi tạo profile làm hỏng đăng ký (500). Nếu lỗi → ghi cảnh báo,
  -- app sẽ tạo bù profile khi người dùng vào dashboard lần đầu.
  BEGIN
    INSERT INTO public.profiles (id, email, name, role, avatar, language)
    VALUES (NEW.id, NEW.email, _name, _role, _avatar, 'en')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: bỏ qua lỗi tạo profile cho % : %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- enforce_admin_email: bọc guard để không bao giờ làm hỏng ghi profile.
CREATE OR REPLACE FUNCTION public.enforce_admin_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    IF (SELECT email FROM auth.users WHERE id = NEW.id) = 'worldatwarduc@gmail.com' THEN
      NEW.role := 'Admin';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- không chặn ghi profile nếu subquery lỗi
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_on_profile ON public.profiles;
CREATE TRIGGER enforce_admin_on_profile
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_email();
