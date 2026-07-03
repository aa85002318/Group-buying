-- 商品多圖與首頁輪播精選團購欄位
-- products.images 已存在於初始 schema，此處僅確保型別正確

ALTER TABLE products
  ALTER COLUMN images SET DEFAULT '[]'::jsonb;

-- 團購活動首頁輪播與橫幅比例備註
ALTER TABLE group_buy_events
  ADD COLUMN IF NOT EXISTS is_homepage_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS banner_aspect_ratio TEXT DEFAULT '16:9';

CREATE INDEX IF NOT EXISTS idx_group_buy_events_homepage
  ON group_buy_events (is_homepage_featured, homepage_sort_order)
  WHERE is_homepage_featured = true;

COMMENT ON COLUMN group_buy_events.is_homepage_featured IS '是否顯示於首頁輪播';
COMMENT ON COLUMN group_buy_events.homepage_sort_order IS '首頁輪播排序（數字越小越前面）';
COMMENT ON COLUMN group_buy_events.banner_aspect_ratio IS '橫幅建議比例，預設 16:9';
