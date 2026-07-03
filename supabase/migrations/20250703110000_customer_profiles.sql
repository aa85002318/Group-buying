-- Customer profile fields: phone + birthday required at registration
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday DATE;

COMMENT ON COLUMN profiles.birthday IS '客戶生日（註冊必填）';
COMMENT ON TABLE profiles IS '客戶／會員資料表（與 auth.users 一對一）';

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Sync profile from auth metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, member_code, full_name, birthday)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
      NULLIF(TRIM(NEW.phone), '')
    ),
    UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8)),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), ''),
    CASE
      WHEN NULLIF(TRIM(NEW.raw_user_meta_data->>'birthday'), '') IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'birthday')::DATE
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    birthday = COALESCE(EXCLUDED.birthday, profiles.birthday),
    updated_at = NOW();

  INSERT INTO public.carts (user_id)
  SELECT NEW.id
  WHERE NOT EXISTS (SELECT 1 FROM public.carts c WHERE c.user_id = NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional read-only view for reporting
CREATE OR REPLACE VIEW customers AS
SELECT
  id,
  email,
  full_name,
  phone,
  birthday,
  member_code,
  role,
  avatar_url,
  referrer_user_id,
  store_id,
  created_at,
  updated_at
FROM profiles
WHERE role = 'member';
