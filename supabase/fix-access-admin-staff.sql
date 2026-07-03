-- =============================================================================
-- 修復後台／門市掃碼無法進入（權限 + RLS 函式）
-- =============================================================================
-- 在 Supabase SQL Editor 執行本檔後，再於本機執行：
--   npm run set-admin
-- 或將下方 email 改成你的帳號後執行「設定管理員」區塊
-- =============================================================================

-- 1. 還原輔助函式（Phase1 可能缺少 search_path，導致 RLS 判斷異常）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_store_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'store_staff'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.staff_store_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT store_id FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
    (SELECT store_id FROM profiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. 確保 profiles 可讀取自己的 role（middleware 需要）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin() OR public.is_staff_or_admin());

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles FOR ALL
  USING (public.is_admin());

-- 3. 補齊 orders 會員下單 INSERT 政策（Phase1 可能覆蓋後遺失）
DROP POLICY IF EXISTS orders_own_insert ON orders;
CREATE POLICY orders_own_insert ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4. 確保註冊觸發器存在（Auth 使用者自動建立 profiles）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, member_code, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
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

-- 5. 為沒有 profile 的既有 Auth 使用者補建 profile
INSERT INTO public.profiles (id, email, member_code, full_name, role)
SELECT
  u.id,
  u.email,
  UPPER(SUBSTRING(REPLACE(u.id::TEXT, '-', ''), 1, 8)),
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'member'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- =============================================================================
-- 6. 設定管理員（請把 email 改成你的帳號）
-- =============================================================================
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'aa85002318@gmail.com';

-- 驗證
SELECT id, email, role, full_name FROM public.profiles ORDER BY created_at DESC LIMIT 10;
