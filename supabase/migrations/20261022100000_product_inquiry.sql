-- ============================================================================
-- 商品詢價
--
-- 需求：部分商品不直接販售，改成讓客戶「加入詢價單」→ 填表送出 → 後台回報價單。
--
-- 設計上刻意沿用既有模組，不另開一套：
--   - 詢價單用既有的 corporate_inquiries（已經有狀態流程 open→contacted→
--     quoted→won→closed，後台也有管理頁），只補客戶勾選的商品明細和兩個欄位。
--   - 報價單用既有的 quotations / quotation_items（品項、折扣、運費、有效期限、
--     可列印），只補「上傳自製報價單檔案」的欄位。
--
-- 全部是新增，不修改也不刪除任何既有欄位或資料。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 商品：銷售方式
-- ---------------------------------------------------------------------------
-- sell    = 照舊，客戶可直接加入購物車結帳
-- inquiry = 不顯示價格、不能下單，前台只提供「加入詢價單」
--
-- 預設 'sell'，所以既有 17,040 筆商品的行為完全不變。
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sales_mode TEXT NOT NULL DEFAULT 'sell';

DO $$
BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_sales_mode_check
    CHECK (sales_mode IN ('sell', 'inquiry'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

COMMENT ON COLUMN public.products.sales_mode IS
  'sell = 直接販售；inquiry = 僅供詢價（前台隱藏價格，改為加入詢價單）';

-- 前台挑「可詢價商品」時會用到。
CREATE INDEX IF NOT EXISTS idx_products_sales_mode
  ON public.products(sales_mode) WHERE sales_mode = 'inquiry';

-- ---------------------------------------------------------------------------
-- 2. 詢價單：補兩個聯絡欄位與來源
-- ---------------------------------------------------------------------------
ALTER TABLE public.corporate_inquiries
  -- 配送資訊：地址、希望到貨方式等，自由文字（客戶不一定知道完整地址）
  ADD COLUMN IF NOT EXISTS delivery_info TEXT,
  -- 方便聯絡時間：例如「平日下午」
  ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT,
  -- 分辨是從哪裡來的：corporate = 既有的企業採購表單；product = 商品詢價單
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'corporate';

DO $$
BEGIN
  ALTER TABLE public.corporate_inquiries
    ADD CONSTRAINT corporate_inquiries_source_check
    CHECK (source IN ('corporate', 'product'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE INDEX IF NOT EXISTS idx_corporate_inquiries_source
  ON public.corporate_inquiries(source, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. 詢價單的商品明細
-- ---------------------------------------------------------------------------
-- 客戶在前台勾選的商品。product_id 用 SET NULL 而不是 CASCADE——商品日後被
-- 刪掉時，詢價紀錄要留著（還有 product_name 這個當下的快照可以看）。
CREATE TABLE IF NOT EXISTS public.corporate_inquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.corporate_inquiries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  -- 送出當下的商品名稱與規格快照，之後商品改名也看得出客戶當初問的是什麼
  product_name TEXT NOT NULL,
  product_spec TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corporate_inquiry_items_inquiry
  ON public.corporate_inquiry_items(inquiry_id, sort_order);

ALTER TABLE public.corporate_inquiry_items ENABLE ROW LEVEL SECURITY;

-- 明細只由伺服器端（service_role）讀寫，前台透過 API 存取。
REVOKE ALL ON public.corporate_inquiry_items FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. 報價單：可上傳自製檔案
-- ---------------------------------------------------------------------------
-- 系統內建的報價單（quotation_items + 列印頁）照舊可用；
-- 這幾個欄位是給「需要蓋章的正式報價單」之類、必須用自己做好的檔案回覆的情況。
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS quote_file_url TEXT,
  ADD COLUMN IF NOT EXISTS quote_file_name TEXT,
  ADD COLUMN IF NOT EXISTS quote_file_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_file_uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.quotations.quote_file_url IS
  '上傳的報價單檔案；有值時客戶端以這份為主，沒有就用系統內建的報價單';

DO $$
BEGIN
  RAISE NOTICE '詢價功能資料層完成：products.sales_mode、詢價單兩個聯絡欄位與來源、詢價明細表、報價單檔案欄位。既有資料未變動。';
END
$$;
