-- Pickup store notes + group-buy carousel product link
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN stores.notes IS '取貨點注意事項（結帳選取後顯示）';

ALTER TABLE group_buy_events
  ADD COLUMN IF NOT EXISTS linked_product_id UUID REFERENCES products(id) ON DELETE SET NULL;

COMMENT ON COLUMN group_buy_events.linked_product_id IS '首頁 16:9 輪播導購商品（點擊導向商品頁）';

CREATE INDEX IF NOT EXISTS idx_group_buy_events_linked_product
  ON group_buy_events(linked_product_id);
