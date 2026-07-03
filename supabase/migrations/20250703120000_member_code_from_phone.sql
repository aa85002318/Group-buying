-- 會員條碼改為手機號碼
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_member_code TEXT;
BEGIN
  v_phone := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.phone), '')
  );
  v_member_code := COALESCE(NULLIF(v_phone, ''), UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8)));

  INSERT INTO public.profiles (id, email, phone, member_code, full_name, birthday)
  VALUES (
    NEW.id,
    NEW.email,
    v_phone,
    v_member_code,
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
    member_code = CASE
      WHEN EXCLUDED.phone IS NOT NULL AND EXCLUDED.phone <> '' THEN EXCLUDED.phone
      ELSE profiles.member_code
    END,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    birthday = COALESCE(EXCLUDED.birthday, profiles.birthday),
    updated_at = NOW();

  INSERT INTO public.carts (user_id)
  SELECT NEW.id
  WHERE NOT EXISTS (SELECT 1 FROM public.carts c WHERE c.user_id = NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 既有一般會員：會員碼同步為手機
UPDATE public.profiles
SET member_code = phone, updated_at = NOW()
WHERE role = 'member'
  AND phone IS NOT NULL
  AND phone <> ''
  AND member_code IS DISTINCT FROM phone;
