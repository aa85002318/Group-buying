-- Member gift admin module extensions (additive)
-- Campaign codes, more types, gift items, per-store inventory

-- Expand campaign types (drop old check, add broader one)
ALTER TABLE gift_campaigns DROP CONSTRAINT IF EXISTS gift_campaigns_campaign_type_check;
ALTER TABLE gift_campaigns
  ADD CONSTRAINT gift_campaigns_campaign_type_check
  CHECK (campaign_type IN (
    'monthly_member_gift',
    'store_spend_gift',
    'targeted_member_gift',
    'birthday_gift',
    'new_member_gift',
    'event_limited_gift'
  ));

ALTER TABLE gift_campaigns DROP CONSTRAINT IF EXISTS gift_campaigns_status_check;
ALTER TABLE gift_campaigns
  ADD CONSTRAINT gift_campaigns_status_check
  CHECK (status IN ('draft', 'scheduled', 'published', 'paused', 'ended'));

ALTER TABLE gift_campaigns
  ADD COLUMN IF NOT EXISTS campaign_code TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_on_frontend BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS list_image_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS inventory_scope TEXT NOT NULL DEFAULT 'shared'
    CHECK (inventory_scope IN ('shared', 'per_store')),
  ADD COLUMN IF NOT EXISTS allow_cross_store_redeem BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS require_store_selection BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_hide_when_sold_out BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS redeem_within_days INTEGER,
  ADD COLUMN IF NOT EXISTS per_member_daily_limit INTEGER,
  ADD COLUMN IF NOT EXISTS allow_repeat_participation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stackable_with_other_gifts BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS require_self_redeem BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS frontend_title TEXT,
  ADD COLUMN IF NOT EXISTS frontend_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS claim_button_label TEXT DEFAULT '立即領取',
  ADD COLUMN IF NOT EXISTS sold_out_label TEXT DEFAULT '兌換完畢',
  ADD COLUMN IF NOT EXISTS activity_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activity_end_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_gift_campaigns_code
  ON gift_campaigns(campaign_code)
  WHERE campaign_code IS NOT NULL;

-- Backfill codes for existing rows
UPDATE gift_campaigns
SET campaign_code = 'MG' || upper(substr(replace(id::text, '-', ''), 1, 10))
WHERE campaign_code IS NULL;

CREATE TABLE IF NOT EXISTS gift_campaign_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES gift_campaigns(id) ON DELETE CASCADE,
  gift_name TEXT NOT NULL,
  gift_image_url TEXT,
  gift_code TEXT,
  product_sku TEXT,
  description TEXT,
  quantity_per_redeem INTEGER NOT NULL DEFAULT 1 CHECK (quantity_per_redeem >= 1),
  cost_amount NUMERIC(12,2),
  requires_store_prep BOOLEAN NOT NULL DEFAULT TRUE,
  requires_variant BOOLEAN NOT NULL DEFAULT FALSE,
  applicable_store_ids UUID[] DEFAULT '{}',
  substitute_item_id UUID REFERENCES gift_campaign_items(id) ON DELETE SET NULL,
  allow_substitute_when_oos BOOLEAN NOT NULL DEFAULT FALSE,
  total_quantity INTEGER,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  redeemed_quantity INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_campaign_items_campaign
  ON gift_campaign_items(campaign_id, sort_order);

DROP TRIGGER IF EXISTS set_updated_at ON gift_campaign_items;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON gift_campaign_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS gift_campaign_store_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES gift_campaigns(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  allocated_quantity INTEGER NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  redeemed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (redeemed_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gift_store_inv_balance CHECK (
    reserved_quantity + redeemed_quantity <= allocated_quantity
  ),
  UNIQUE (campaign_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_gift_store_inv_store
  ON gift_campaign_store_inventory(store_id);

DROP TRIGGER IF EXISTS set_updated_at ON gift_campaign_store_inventory;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON gift_campaign_store_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE member_gift_claims
  ADD COLUMN IF NOT EXISTS gift_item_id UUID REFERENCES gift_campaign_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS void_reason TEXT,
  ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reversal_of_claim_id UUID REFERENCES member_gift_claims(id) ON DELETE SET NULL;

ALTER TABLE gift_campaign_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_campaign_store_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gift_items_admin_all ON gift_campaign_items;
CREATE POLICY gift_items_admin_all ON gift_campaign_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS gift_items_member_read ON gift_campaign_items;
CREATE POLICY gift_items_member_read ON gift_campaign_items FOR SELECT
  USING (
    is_active AND EXISTS (
      SELECT 1 FROM gift_campaigns c
      WHERE c.id = campaign_id AND c.status IN ('published', 'ended')
    )
  );

DROP POLICY IF EXISTS gift_store_inv_admin_all ON gift_campaign_store_inventory;
CREATE POLICY gift_store_inv_admin_all ON gift_campaign_store_inventory FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS gift_store_inv_staff_read ON gift_campaign_store_inventory;
CREATE POLICY gift_store_inv_staff_read ON gift_campaign_store_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('store_staff', 'admin')
    )
  );
