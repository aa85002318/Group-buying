-- ============================================================================
-- 報價單檔案專用的私有 storage bucket
--
-- 為什麼不沿用 cms-assets（原本的做法，已證實是錯的）：
--   1. cms-assets 的 allowed_mime_types 只有圖片，PDF／Word／Excel 全部會被拒。
--      實測：mime type application/pdf is not supported
--   2. cms-assets 是 public bucket。報價單上有客戶名稱與報價金額，
--      放進公開 bucket 等於「知道網址就看得到」。
--
-- 所以另開一個私有 bucket，讀取改用短時效 signed URL。
-- 全部是新增，不動任何既有 bucket 或檔案。
-- ============================================================================

-- 4MB：Vercel serverless function 的請求上限約 4.5MB，超過的話在進到我們的
-- 程式之前就會被平台以 413 FUNCTION_PAYLOAD_TOO_LARGE 擋掉（實測過）。
-- 設 4MB 讓錯誤訊息由我們自己給，而不是一個看不懂的平台錯誤。
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quotation-files',
  'quotation-files',
  FALSE,
  4194304,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 刻意不建任何給 anon / authenticated 的 storage policy：
-- 這個 bucket 只由伺服器端（service_role）讀寫，前台一律透過後台 API 取得
-- signed URL，所以不需要、也不應該開放給瀏覽器直接存取。

-- 這個欄位存的是 bucket 內的「路徑」，不是可以直接開的網址——bucket 是私有的，
-- 要開檔案必須透過後台 API 換一個短時效 signed URL。欄位名稱是先前就定下的，
-- 這裡把語意講清楚，免得有人把它直接塞進 href。
COMMENT ON COLUMN public.quotations.quote_file_url IS
  'quotation-files bucket 內的檔案路徑（非公開網址）。下載請打 /api/admin/quotations/[id]/quote-file 取得 signed URL';

DO $$
BEGIN
  RAISE NOTICE '已建立 quotation-files（私有，4MB，接受 PDF／Office／圖片）。既有 bucket 未變動。';
END
$$;
