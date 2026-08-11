-- Order fulfillment + store pickup (phase 1)
-- Adds canonical fulfillment fields, logs, hashed pickup codes, redemptions, settings.

-- Enum values for future writes (not referenced in this migration)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancel_requested';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refund_pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pickup_expired';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'exception';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT,
  ADD COLUMN IF NOT EXISTS pickup_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_extended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exception_reason TEXT,
  ADD COLUMN IF NOT EXISTS exception_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status
  ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_deadline
  ON orders(pickup_deadline_at)
  WHERE pickup_deadline_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  note TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_logs_order
  ON order_status_logs(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fulfillment_settings (
  settings_key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO fulfillment_settings (settings_key, config)
VALUES ('default', '{
  "hold_days_ambient": 7,
  "hold_days_chilled": 3,
  "hold_days_frozen": 2,
  "remind_days_before": 2,
  "remind_on_due_day": true,
  "allow_extend_once": true,
  "extend_days": 3,
  "prep_days": 1,
  "expired_refund_policy": "manual",
  "auto_complete_after_pickup": true
}'::jsonb)
ON CONFLICT (settings_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS store_pickup_settings (
  store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  prep_days INTEGER NOT NULL DEFAULT 1,
  hold_days_ambient INTEGER,
  hold_days_chilled INTEGER,
  hold_days_frozen INTEGER,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pickup_codes: allow history + hashed PIN
ALTER TABLE pickup_codes
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_cipher TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'pickup_codes'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%order_id%'
  LOOP
    EXECUTE format('ALTER TABLE pickup_codes DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_pickup_codes_order_active
  ON pickup_codes(order_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pickup_codes_pin_hash
  ON pickup_codes(pin_hash)
  WHERE is_active = TRUE AND pin_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS pickup_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pickup_code_id UUID REFERENCES pickup_codes(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pos_device TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  void_reason TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_pickup_redemptions_order
  ON pickup_redemptions(order_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pickup_redemptions_store
  ON pickup_redemptions(store_id, redeemed_at DESC);

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'committed', 'released', 'fulfilled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order
  ON inventory_reservations(order_id);

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('app', 'line', 'email')),
  status TEXT NOT NULL DEFAULT 'sent',
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_order
  ON notification_logs(order_id, created_at DESC);

ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_pickup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_status_logs_member ON order_status_logs;
CREATE POLICY order_status_logs_member ON order_status_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS order_status_logs_staff ON order_status_logs;
CREATE POLICY order_status_logs_staff ON order_status_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_staff', 'store_manager', 'customer_service')
    )
  );

DROP POLICY IF EXISTS fulfillment_settings_staff ON fulfillment_settings;
CREATE POLICY fulfillment_settings_staff ON fulfillment_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_manager')
    )
  );

DROP POLICY IF EXISTS store_pickup_settings_public ON store_pickup_settings;
CREATE POLICY store_pickup_settings_public ON store_pickup_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS store_pickup_settings_staff ON store_pickup_settings;
CREATE POLICY store_pickup_settings_staff ON store_pickup_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_manager')
    )
  );

DROP POLICY IF EXISTS pickup_redemptions_staff ON pickup_redemptions;
CREATE POLICY pickup_redemptions_staff ON pickup_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_staff', 'store_manager')
    )
  );

DROP POLICY IF EXISTS refunds_member ON refunds;
CREATE POLICY refunds_member ON refunds FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS refunds_staff ON refunds;
CREATE POLICY refunds_staff ON refunds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_manager', 'customer_service')
    )
  );

DROP POLICY IF EXISTS inventory_reservations_staff ON inventory_reservations;
CREATE POLICY inventory_reservations_staff ON inventory_reservations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_staff', 'store_manager')
    )
  );

DROP POLICY IF EXISTS notification_logs_staff ON notification_logs;
CREATE POLICY notification_logs_staff ON notification_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_manager', 'customer_service')
    )
  );

CREATE TABLE IF NOT EXISTS order_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  handler_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contacted_at TIMESTAMPTZ,
  member_reply TEXT,
  resolution TEXT,
  price_diff NUMERIC(12,2),
  refund_amount NUMERIC(12,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE order_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_exceptions_staff ON order_exceptions;
CREATE POLICY order_exceptions_staff ON order_exceptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_manager', 'customer_service')
    )
  );

COMMENT ON COLUMN orders.fulfillment_status IS 'Canonical mall fulfillment status; orders.status stays enum-compatible';
