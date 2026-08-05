-- Store service forms v2: unified issue/return fields, repair customer trail,
-- optional batch, disposal statuses, multi photos, status history.

-- ---------------------------------------------------------------------------
-- Shared columns (safe re-run)
-- ---------------------------------------------------------------------------
ALTER TABLE store_anomalies
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS invoice_no TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS product_expiry DATE,
  ADD COLUMN IF NOT EXISTS case_kind TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pieces_count NUMERIC,
  ADD COLUMN IF NOT EXISTS vendor_name TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE store_returns
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS return_number TEXT,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invoice_no TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS product_expiry DATE,
  ADD COLUMN IF NOT EXISTS case_kind TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE store_disposals
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS total_loss NUMERIC,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS disposed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS product_expiry DATE,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW();

-- batch already nullable; ensure comment reflects optional
COMMENT ON COLUMN store_disposals.batch_id IS '報廢批次（選填）';
COMMENT ON COLUMN store_returns.batch_id IS '退貨批次（選填）';
COMMENT ON COLUMN store_anomalies.batch_id IS '異常批次（選填）';

-- ---------------------------------------------------------------------------
-- Expand check constraints
-- ---------------------------------------------------------------------------
ALTER TABLE store_anomalies DROP CONSTRAINT IF EXISTS store_anomalies_anomaly_type_check;
ALTER TABLE store_anomalies
  ADD CONSTRAINT store_anomalies_anomaly_type_check CHECK (
    anomaly_type = ANY (ARRAY[
      'expiry'::text,
      'damage'::text,
      'shortage'::text,
      'surplus'::text,
      'other'::text,
      'repair'::text,
      'special'::text,
      'customer_return'::text,
      'arrival_anomaly'::text
    ])
  );

ALTER TABLE store_anomalies DROP CONSTRAINT IF EXISTS store_anomalies_status_check;
ALTER TABLE store_anomalies
  ADD CONSTRAINT store_anomalies_status_check CHECK (
    status = ANY (ARRAY[
      'open'::text,
      'processing'::text,
      'resolved'::text,
      'closed'::text,
      -- unified issue/return
      'pending'::text,
      'exchanged'::text,
      'destroyed'::text,
      'awaiting_vendor'::text,
      'vendor_received'::text,
      -- repair
      'notified_vendor'::text,
      'vendor_collected'::text,
      'repair_done_contacted'::text,
      'customer_picked_up'::text
    ])
  );

ALTER TABLE store_returns DROP CONSTRAINT IF EXISTS store_returns_status_check;
ALTER TABLE store_returns
  ADD CONSTRAINT store_returns_status_check CHECK (
    status = ANY (ARRAY[
      'open'::text,
      'approved'::text,
      'rejected'::text,
      'completed'::text,
      'pending'::text,
      'exchanged'::text,
      'destroyed'::text,
      'awaiting_vendor'::text,
      'vendor_received'::text
    ])
  );

ALTER TABLE store_disposals DROP CONSTRAINT IF EXISTS store_disposals_status_check;
ALTER TABLE store_disposals
  ADD CONSTRAINT store_disposals_status_check CHECK (
    status = ANY (ARRAY[
      'open'::text,
      'approved'::text,
      'completed'::text,
      'disposed'::text,
      'pending'::text,
      'vendor_returned'::text
    ])
  );

-- ---------------------------------------------------------------------------
-- Status change trail (repair / issue / return / disposal)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (
    resource_type = ANY (ARRAY[
      'store_anomalies'::text,
      'store_returns'::text,
      'store_disposals'::text
    ])
  ),
  resource_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_status_logs_resource
  ON store_status_logs(resource_type, resource_id, changed_at DESC);

ALTER TABLE store_status_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_status_logs_staff ON store_status_logs;
CREATE POLICY store_status_logs_staff ON store_status_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  );

COMMENT ON TABLE store_status_logs IS '門市服務狀態變更軌跡（報修／異常／退貨／報廢）';
