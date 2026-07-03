-- 商品上架完整欄位
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS specifications TEXT,
  ADD COLUMN IF NOT EXISTS is_group_buy BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_buy_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS group_buy_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_quantity_per_user INT,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS product_info TEXT;

COMMENT ON COLUMN products.original_price IS '商品原價';
COMMENT ON COLUMN products.price IS '團購價（售價）';
COMMENT ON COLUMN products.specifications IS '商品規格';
COMMENT ON COLUMN products.is_group_buy IS '是否為團購商品';
COMMENT ON COLUMN products.group_buy_start_at IS '團購開始時間';
COMMENT ON COLUMN products.group_buy_end_at IS '團購結束時間';
COMMENT ON COLUMN products.max_quantity_per_user IS '每人限購數量';
COMMENT ON COLUMN products.supplier_name IS '供應商名稱';
COMMENT ON COLUMN products.cost_price IS '成本價';
COMMENT ON COLUMN products.product_info IS '產品資訊（成分、保存方式等）';

CREATE INDEX IF NOT EXISTS idx_products_is_group_buy ON products(is_group_buy);
CREATE INDEX IF NOT EXISTS idx_products_group_buy_dates ON products(group_buy_start_at, group_buy_end_at);

-- 商品可取貨門市（多對多）
CREATE TABLE IF NOT EXISTS product_pickup_stores (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_product_pickup_stores_store ON product_pickup_stores(store_id);

ALTER TABLE product_pickup_stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_pickup_stores_public_read ON product_pickup_stores;
CREATE POLICY product_pickup_stores_public_read ON product_pickup_stores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_pickup_stores_admin_write ON product_pickup_stores;
CREATE POLICY product_pickup_stores_admin_write ON product_pickup_stores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
