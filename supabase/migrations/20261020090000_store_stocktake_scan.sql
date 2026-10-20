-- ============================================================================
-- 手機掃碼盤點
--
-- 背景：POS 沒有連動，賣出數量算不出來，所以門市庫存唯一可靠的來源是人工清點。
-- 盤點完成後，該門市＋該商品的數量「以盤點為準」，不再從批號餘量推算。
--
-- 這份 migration 全部是新增，不修改也不刪除任何既有欄位或資料：
--   1. store_inventory 加三個欄位，用來標記「這一格是盤點來的」
--   2. 新增一張未知條碼待處理表
--
-- 既有的 store_stocktakes / store_stocktake_lines 已經存在（Store Ops V2），
-- 這裡只補索引，表結構不動。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. store_inventory：標記資料來源
-- ---------------------------------------------------------------------------
-- source = 'batches'   ：沿用原本的行為，數量由 store_batches 餘量加總推算
-- source = 'stocktake' ：以人工盤點為準，syncInventoryFromBatches 不再覆蓋它
ALTER TABLE public.store_inventory
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'batches',
  ADD COLUMN IF NOT EXISTS counted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS counted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  ALTER TABLE public.store_inventory
    ADD CONSTRAINT store_inventory_source_check
    CHECK (source IN ('batches', 'stocktake'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

COMMENT ON COLUMN public.store_inventory.source IS
  'batches = 由批號餘量推算（原行為）；stocktake = 以人工盤點為準，不再被批號加總覆蓋';

-- ---------------------------------------------------------------------------
-- 2. 未知條碼待處理清單
-- ---------------------------------------------------------------------------
-- 掃到系統查不到的條碼時先收進來，不中斷掃碼流程；事後再綁定到正確商品。
CREATE TABLE IF NOT EXISTS public.store_unknown_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  scanned_count INTEGER NOT NULL DEFAULT 1,
  -- 掃的當下如果有填數量就記著，綁定商品後可以直接沿用
  counted_qty NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'ignored')),
  -- 綁定到哪個商品（resolved 時才有）
  resolved_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 同一門市同一條碼只留一筆，重複掃就累加次數
  UNIQUE (store_id, barcode)
);

CREATE INDEX IF NOT EXISTS idx_store_unknown_barcodes_pending
  ON public.store_unknown_barcodes(store_id, status, created_at DESC);

ALTER TABLE public.store_unknown_barcodes ENABLE ROW LEVEL SECURITY;

-- 這張表只由伺服器端（service_role）讀寫，前台不直接碰。
REVOKE ALL ON public.store_unknown_barcodes FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. 盤點明細查詢用的索引
-- ---------------------------------------------------------------------------
-- 掃到同一個商品時要回頭找出那一行來改數量，這個查詢會很頻繁。
CREATE INDEX IF NOT EXISTS idx_store_stocktake_lines_product
  ON public.store_stocktake_lines(stocktake_id, product_id);

-- 盤點單列表要按門市和狀態撈。
CREATE INDEX IF NOT EXISTS idx_store_stocktakes_store_status
  ON public.store_stocktakes(store_id, status, created_at DESC);

DO $$
BEGIN
  RAISE NOTICE '盤點資料層建立完成：store_inventory 加了 source/counted_at/counted_by，未知條碼表已建立。既有資料未變動。';
END
$$;
