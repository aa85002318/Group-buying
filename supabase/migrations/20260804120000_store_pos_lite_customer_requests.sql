-- POS Lite: in-store customer service requests (not ecommerce orders)
-- Shares products / suppliers — no parallel catalog.

CREATE TABLE IF NOT EXISTS store_customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL
    CHECK (request_type IN ('order', 'price_inquiry')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_source TEXT
    CHECK (
      customer_source IS NULL
      OR customer_source IN (
        'store', 'line', 'phone', 'facebook', 'instagram', 'group_buy', 'website'
      )
    ),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  barcode TEXT,
  vendor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity NUMERIC CHECK (quantity IS NULL OR quantity > 0),
  unit_price NUMERIC,
  stock_snapshot NUMERIC,
  in_stock BOOLEAN,
  expected_arrival_date DATE,
  inquiry_body TEXT,
  needs_reply BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  internal_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'quoted',
        'notified',
        'paid',
        'picked_up',
        'done',
        'cancelled'
      )
    ),
  track_notified BOOLEAN NOT NULL DEFAULT false,
  track_paid BOOLEAN NOT NULL DEFAULT false,
  track_picked_up BOOLEAN NOT NULL DEFAULT false,
  track_done BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  follow_up_at DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_customer_requests_store_created
  ON store_customer_requests(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_customer_requests_type_status
  ON store_customer_requests(request_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_customer_requests_product
  ON store_customer_requests(product_id)
  WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_customer_requests_phone
  ON store_customer_requests(customer_phone);

ALTER TABLE store_customer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_customer_requests_staff ON store_customer_requests;
CREATE POLICY store_customer_requests_staff ON store_customer_requests FOR ALL
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

DROP TRIGGER IF EXISTS set_updated_at ON store_customer_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON store_customer_requests
  FOR EACH ROW EXECUTE FUNCTION store_ops_set_updated_at();

COMMENT ON TABLE store_customer_requests IS
  'POS Lite 現場客戶服務（商品訂購／價格詢問）；商品主檔仍為 products';
