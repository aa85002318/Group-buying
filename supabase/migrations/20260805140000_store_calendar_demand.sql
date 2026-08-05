-- Void invoices + request kind for store demand/out-of-stock

CREATE TABLE IF NOT EXISTS store_void_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  void_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  invoice_no TEXT NOT NULL,
  reason TEXT NOT NULL,
  invoice_medium TEXT NOT NULL DEFAULT 'paper'
    CHECK (invoice_medium IN ('carrier', 'paper')),
  carrier_code TEXT,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_void_invoices_store_date
  ON store_void_invoices(store_id, void_date DESC, created_at DESC);

ALTER TABLE store_void_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_void_invoices_staff ON store_void_invoices;
CREATE POLICY store_void_invoices_staff ON store_void_invoices FOR ALL
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

ALTER TABLE store_requests
  ADD COLUMN IF NOT EXISTS request_kind TEXT NOT NULL DEFAULT 'restock'
    CHECK (request_kind IN ('restock', 'out_of_stock'));

CREATE INDEX IF NOT EXISTS idx_store_requests_kind
  ON store_requests(store_id, request_kind, status, created_at DESC);

COMMENT ON TABLE store_void_invoices IS '門市作廢發票紀錄（行事曆）';
COMMENT ON COLUMN store_requests.request_kind IS 'restock=叫貨需求；out_of_stock=商品缺貨通知';
