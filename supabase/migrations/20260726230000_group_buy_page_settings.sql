-- Group-buy page settings (JSON in site_settings) + event display fields

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON site_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_public_read ON site_settings;
CREATE POLICY site_settings_public_read ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS site_settings_admin ON site_settings;
CREATE POLICY site_settings_admin ON site_settings
  FOR ALL USING (is_admin());

INSERT INTO site_settings (key, value)
VALUES ('group_buy_page', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Optional display / threshold fields on existing group_buy_events
ALTER TABLE group_buy_events
  ADD COLUMN IF NOT EXISTS short_title TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expected_arrival_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC,
  ADD COLUMN IF NOT EXISTS group_price NUMERIC,
  ADD COLUMN IF NOT EXISTS member_group_price NUMERIC,
  ADD COLUMN IF NOT EXISTS min_qty INT,
  ADD COLUMN IF NOT EXISTS max_qty_per_user INT,
  ADD COLUMN IF NOT EXISTS threshold_type TEXT NOT NULL DEFAULT 'none'
    CHECK (threshold_type IN ('none', 'qty', 'people', 'amount')),
  ADD COLUMN IF NOT EXISTS threshold_value NUMERIC,
  ADD COLUMN IF NOT EXISTS show_progress BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_reached_badge BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_under_threshold BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fulfillment_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stats_mode TEXT NOT NULL DEFAULT 'orders'
    CHECK (stats_mode IN ('orders', 'members', 'qty', 'hidden')),
  ADD COLUMN IF NOT EXISTS category_label TEXT;

CREATE INDEX IF NOT EXISTS idx_group_buy_events_sort
  ON group_buy_events (is_featured DESC, sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_buy_events_window
  ON group_buy_events (start_at, end_at);
