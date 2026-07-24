-- Store ops MVP: extend existing store_* tables (no parallel product catalog).
-- products remains the single Product Master.

-- ---------------------------------------------------------------------------
-- Product Master additive fields
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS member_price NUMERIC,
  ADD COLUMN IF NOT EXISTS package_spec TEXT,
  ADD COLUMN IF NOT EXISTS safety_stock NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER,
  ADD COLUMN IF NOT EXISTS storage_method TEXT,
  ADD COLUMN IF NOT EXISTS is_recipe_enabled BOOLEAN NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- Inventory batches (store_batches = store_inventory_batches)
-- ---------------------------------------------------------------------------
ALTER TABLE store_batches
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS remaining_quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS manufactured_at DATE,
  ADD COLUMN IF NOT EXISTS received_at DATE,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE store_batches
SET remaining_quantity = quantity
WHERE remaining_quantity IS NULL;

CREATE INDEX IF NOT EXISTS idx_store_batches_barcode ON store_batches(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_batches_status ON store_batches(status);
CREATE INDEX IF NOT EXISTS idx_store_batches_product ON store_batches(product_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_batches_status_check'
  ) THEN
    ALTER TABLE store_batches
      ADD CONSTRAINT store_batches_status_check
      CHECK (status IN ('active', 'expired', 'disposed', 'returned', 'closed'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Disposals / anomalies / returns extras
-- ---------------------------------------------------------------------------
ALTER TABLE store_disposals
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS total_loss NUMERIC,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS disposed_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE store_anomalies
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE store_returns
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS return_number TEXT,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Import jobs + backup logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type TEXT NOT NULL CHECK (
    import_type IN ('expiry', 'disposal', 'products', 'batches')
  ),
  file_name TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_report JSONB DEFAULT '[]'::jsonb,
  preview_snapshot JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'preview'
    CHECK (status IN ('preview', 'committed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  committed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS store_backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (backup_type IN ('manual', 'scheduled', 'drive')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed')),
  drive_folder_id TEXT,
  drive_account TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

ALTER TABLE store_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_backup_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_import_jobs_staff ON store_import_jobs;
CREATE POLICY store_import_jobs_staff ON store_import_jobs FOR ALL
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

DROP POLICY IF EXISTS store_backup_logs_staff ON store_backup_logs;
CREATE POLICY store_backup_logs_staff ON store_backup_logs FOR ALL
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

-- ---------------------------------------------------------------------------
-- Compatibility views (read models; writes still go to base tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW store_inventory_batches
WITH (security_invoker = true)
AS
SELECT
  id,
  store_id,
  product_id,
  supplier_id,
  batch_no AS batch_number,
  barcode,
  quantity,
  COALESCE(remaining_quantity, quantity) AS remaining_quantity,
  manufactured_at,
  expiry_date AS expires_at,
  received_at,
  cost_price,
  location,
  status,
  created_by,
  created_at,
  updated_at
FROM store_batches;

CREATE OR REPLACE VIEW store_expiry_records
WITH (security_invoker = true)
AS
SELECT
  id,
  id AS inventory_batch_id,
  product_id,
  expiry_date AS expires_at,
  COALESCE(remaining_quantity, quantity) AS quantity,
  status,
  'monitor'::text AS action_type,
  notes AS note,
  created_by,
  created_at,
  updated_at
FROM store_batches
WHERE expiry_date IS NOT NULL;

CREATE OR REPLACE VIEW store_disposal_records
WITH (security_invoker = true)
AS
SELECT
  id,
  product_id,
  batch_id AS inventory_batch_id,
  quantity,
  unit_cost,
  total_loss,
  reason,
  photo_url,
  COALESCE(disposed_at, created_at) AS disposed_at,
  created_by,
  created_at
FROM store_disposals;

CREATE OR REPLACE VIEW store_issue_records
WITH (security_invoker = true)
AS
SELECT
  id,
  product_id,
  batch_id AS inventory_batch_id,
  anomaly_type AS issue_type,
  description,
  quantity,
  photo_url,
  status,
  resolution,
  reported_by,
  resolved_by,
  COALESCE(reported_at, created_at) AS reported_at,
  resolved_at
FROM store_anomalies;

CREATE OR REPLACE VIEW store_return_records
WITH (security_invoker = true)
AS
SELECT
  id,
  product_id,
  supplier_id,
  batch_id AS inventory_batch_id,
  quantity,
  reason,
  status,
  return_number,
  returned_at,
  created_by,
  created_at,
  updated_at
FROM store_returns;

CREATE OR REPLACE VIEW admin_audit_logs
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  entity_type AS module,
  action,
  entity_type AS resource_type,
  entity_id AS resource_id,
  old_data,
  new_data,
  ip_address,
  user_agent,
  created_at
FROM audit_logs;

-- Role permissions for store modules
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
  ('admin', 'store_batches', true, true, true, true),
  ('admin', 'store_disposals', true, true, true, true),
  ('admin', 'store_anomalies', true, true, true, true),
  ('admin', 'store_returns', true, true, true, true),
  ('admin', 'store_import', true, true, true, true),
  ('store_staff', 'store_batches', true, true, true, false),
  ('store_staff', 'store_disposals', true, true, true, false),
  ('store_staff', 'store_anomalies', true, true, true, false),
  ('store_staff', 'store_returns', true, true, true, false),
  ('store_staff', 'store_import', true, true, false, false)
ON CONFLICT (role, resource) DO NOTHING;
