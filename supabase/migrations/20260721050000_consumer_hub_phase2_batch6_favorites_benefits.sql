-- Consumer Hub 2.0 Batch 6: polymorphic favorites, address note, member benefits
-- Safe to re-run. Does not touch POS / spending tables.

-- ---------------------------------------------------------------------------
-- favorites (product | recipe | video)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'recipe', 'video')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favorites_user_target_unique UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON favorites(user_id, target_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_target ON favorites(target_type, target_id);

-- Migrate existing product favorites (idempotent)
INSERT INTO favorites (user_id, target_type, target_id, created_at)
SELECT user_id, 'product', product_id, created_at
FROM product_favorites
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favorites_own ON favorites;
CREATE POLICY favorites_own ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- member_addresses.note
-- ---------------------------------------------------------------------------
ALTER TABLE member_addresses
  ADD COLUMN IF NOT EXISTS note TEXT;

-- ---------------------------------------------------------------------------
-- member_benefits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  image_url TEXT,
  usage_instructions TEXT,
  usage_location TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'disabled')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_benefits_status ON member_benefits(status, starts_at);

DROP TRIGGER IF EXISTS set_updated_at ON member_benefits;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON member_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- member_benefit_assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_benefit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id UUID NOT NULL REFERENCES member_benefits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'used', 'expired', 'upcoming', 'disabled', 'revoked')),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'all_members', 'user_list', 'group_buy', 'campaign', 'course')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT member_benefit_assignments_unique UNIQUE (benefit_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mba_user ON member_benefit_assignments(user_id, status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_mba_benefit ON member_benefit_assignments(benefit_id, status);

DROP TRIGGER IF EXISTS set_updated_at ON member_benefit_assignments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON member_benefit_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE member_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_benefit_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_benefits_admin ON member_benefits;
CREATE POLICY member_benefits_admin ON member_benefits FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Members can read active benefit definitions that they were assigned
DROP POLICY IF EXISTS member_benefits_assigned_read ON member_benefits;
CREATE POLICY member_benefits_assigned_read ON member_benefits FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM member_benefit_assignments a
      WHERE a.benefit_id = member_benefits.id
        AND a.user_id = auth.uid()
        AND a.status <> 'revoked'
    )
  );

DROP POLICY IF EXISTS member_benefit_assignments_own_read ON member_benefit_assignments;
CREATE POLICY member_benefit_assignments_own_read ON member_benefit_assignments FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS member_benefit_assignments_admin ON member_benefit_assignments;
CREATE POLICY member_benefit_assignments_admin ON member_benefit_assignments FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
