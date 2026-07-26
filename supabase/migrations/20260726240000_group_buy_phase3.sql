-- Group-buy Phase 3: virtual sold qty + display label flag

ALTER TABLE group_buy_events
  ADD COLUMN IF NOT EXISTS virtual_sold_qty INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_virtual_sales_label BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN group_buy_events.virtual_sold_qty IS
  'Admin boost added to displayed sold quantity; real order stats stay separate.';
COMMENT ON COLUMN group_buy_events.show_virtual_sales_label IS
  'When true and virtual_sold_qty > 0, storefront shows an explicit virtual-sales label.';
