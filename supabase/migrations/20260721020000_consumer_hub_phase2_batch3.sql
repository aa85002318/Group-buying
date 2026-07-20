-- Consumer Hub 2.0 Batch 3: App order admin notes, member account flags
-- Safe to re-run

-- ---------------------------------------------------------------------------
-- orders: internal admin notes (separate from customer-facing notes)
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN orders.admin_notes IS '內部備註（僅後台可見，非客戶備註）';

-- ---------------------------------------------------------------------------
-- profiles: account active flag + internal admin notes
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN profiles.is_active IS 'App 帳號是否啟用（停用後不可正常登入使用）';
COMMENT ON COLUMN profiles.admin_notes IS '後台內部備註（不含 POS／門市消費）';

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- ---------------------------------------------------------------------------
-- Ensure audit_logs remains admin-readable (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_admin ON audit_logs;
CREATE POLICY audit_logs_admin ON audit_logs
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT WITH CHECK (true);
