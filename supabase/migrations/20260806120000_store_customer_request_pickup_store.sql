-- Additive: customer service pickup store (collaboration center, not POS)
ALTER TABLE store_customer_requests
  ADD COLUMN IF NOT EXISTS pickup_store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_store_customer_requests_pickup_store
  ON store_customer_requests(pickup_store_id)
  WHERE pickup_store_id IS NOT NULL;

COMMENT ON COLUMN store_customer_requests.pickup_store_id IS
  '指定取貨分店（客戶服務訂購）；不扣庫存、不串接收銀';

COMMENT ON TABLE store_customer_requests IS
  '門市協作中心：客戶服務（商品訂購／價格詢問）；商品主檔仍為 products';
