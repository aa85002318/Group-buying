-- Store Ops V2: batch-centric ops, inventory movements, stocktake
-- Safe to re-run. Does NOT create store_products / parallel catalog.

-- ---------------------------------------------------------------------------
-- Ensure batch_id on ops tables (already present from phase5; re-assert)
-- ---------------------------------------------------------------------------
ALTER TABLE store_disposals
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL;

ALTER TABLE store_returns
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL;

ALTER TABLE store_anomalies
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_store_disposals_batch ON store_disposals(batch_id);
CREATE INDEX IF NOT EXISTS idx_store_returns_batch ON store_returns(batch_id);
CREATE INDEX IF NOT EXISTS idx_store_anomalies_batch ON store_anomalies(batch_id);

-- ---------------------------------------------------------------------------
-- Batch fields already added in store_ops_mvp; ensure defaults
-- ---------------------------------------------------------------------------
ALTER TABLE store_batches
  ADD COLUMN IF NOT EXISTS remaining_quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS received_at DATE,
  ADD COLUMN IF NOT EXISTS manufactured_at DATE,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

UPDATE store_batches
SET remaining_quantity = quantity
WHERE remaining_quantity IS NULL;

-- ---------------------------------------------------------------------------
-- Inventory movements (進貨／退貨／報廢／盤點／調整)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (
    movement_type IN ('receive', 'return', 'disposal', 'stocktake', 'adjust', 'sale', 'transfer')
  ),
  quantity_delta NUMERIC NOT NULL,
  quantity_before NUMERIC,
  quantity_after NUMERIC,
  unit_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch ON inventory_movements(batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store ON inventory_movements(store_id, created_at DESC);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_movements_staff ON inventory_movements;
CREATE POLICY inventory_movements_staff ON inventory_movements FOR ALL
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
-- Stocktake (盤點)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_stocktakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '盤點',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_stocktake_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stocktake_id UUID NOT NULL REFERENCES store_stocktakes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL,
  system_qty NUMERIC NOT NULL DEFAULT 0,
  counted_qty NUMERIC,
  variance NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_stocktake_lines_stocktake ON store_stocktake_lines(stocktake_id);

ALTER TABLE store_stocktakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_stocktake_lines ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_updated_at ON store_stocktakes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON store_stocktakes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS store_stocktakes_staff ON store_stocktakes;
CREATE POLICY store_stocktakes_staff ON store_stocktakes FOR ALL
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

DROP POLICY IF EXISTS store_stocktake_lines_staff ON store_stocktake_lines;
CREATE POLICY store_stocktake_lines_staff ON store_stocktake_lines FOR ALL
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

COMMENT ON TABLE inventory_movements IS 'Store Ops V2 庫存異動（進貨／退貨／報廢／盤點／調整）';
COMMENT ON TABLE store_stocktakes IS '門市盤點單';
COMMENT ON COLUMN store_disposals.batch_id IS '報廢必須關聯批次（V2）';
