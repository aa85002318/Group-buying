-- Consumer Hub 2.0 Batch 7: notification campaigns, FAQ featured, support settings
-- Safe to re-run. App-only notifications — no POS events.

-- ---------------------------------------------------------------------------
-- Expand notifications.notification_type
-- ---------------------------------------------------------------------------
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS campaign_id UUID;

DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'order', 'pickup', 'product', 'livestream', 'system',
    'group_buy', 'campaign', 'benefit', 'store'
  ));

-- ---------------------------------------------------------------------------
-- notification_campaigns (admin compose / schedule / send)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system'
    CHECK (category IN (
      'order', 'group_buy', 'campaign', 'benefit', 'store', 'system',
      'pickup', 'product', 'livestream'
    )),
  target_type TEXT,
  target_id TEXT,
  link_url TEXT,
  audience_type TEXT NOT NULL DEFAULT 'all'
    CHECK (audience_type IN ('all', 'users', 'order_status')),
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status
  ON notification_campaigns(status, scheduled_at);

DROP TRIGGER IF EXISTS set_updated_at ON notification_campaigns;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON notification_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_campaigns_admin ON notification_campaigns;
CREATE POLICY notification_campaigns_admin ON notification_campaigns FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_campaign_id_fkey'
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES notification_campaigns(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- faqs: featured / hot
-- ---------------------------------------------------------------------------
ALTER TABLE faqs
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_faqs_featured ON faqs(is_featured, sort_order) WHERE is_featured = true;

-- ---------------------------------------------------------------------------
-- support_settings (singleton via settings_key)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_key TEXT NOT NULL UNIQUE DEFAULT 'default',
  phone TEXT,
  email TEXT,
  line_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  address TEXT,
  business_hours TEXT,
  google_map_url TEXT,
  returns_info TEXT,
  shipping_info TEXT,
  support_info TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at ON support_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON support_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO support_settings (
  settings_key, phone, email, line_url, address, business_hours, support_info
) VALUES (
  'default',
  '02-2737-5508',
  NULL,
  'https://line.me/R/ti/p/@diy_chimei',
  NULL,
  '請以門市實際營業時間為準',
  '僅處理 CHIMEIDIY App 訂單與會員服務，不含門市 POS 現場消費查詢。'
)
ON CONFLICT (settings_key) DO NOTHING;

ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_settings_public_read ON support_settings;
CREATE POLICY support_settings_public_read ON support_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS support_settings_admin ON support_settings;
CREATE POLICY support_settings_admin ON support_settings FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
