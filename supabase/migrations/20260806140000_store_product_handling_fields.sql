-- Product handling shared form fields (additive).
-- Soft-fail in API if not yet applied.

ALTER TABLE store_anomalies
  ADD COLUMN IF NOT EXISTS pause_sales BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assignee_name TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT,
  ADD COLUMN IF NOT EXISTS affects_operations BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE store_disposals
  ADD COLUMN IF NOT EXISTS manager_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assignee_name TEXT,
  ADD COLUMN IF NOT EXISTS disposal_reason_code TEXT;

ALTER TABLE store_returns
  ADD COLUMN IF NOT EXISTS return_target TEXT,
  ADD COLUMN IF NOT EXISTS expected_return_date DATE,
  ADD COLUMN IF NOT EXISTS assignee_name TEXT;

COMMENT ON COLUMN store_anomalies.pause_sales IS '商品異常：是否暫停銷售';
COMMENT ON COLUMN store_anomalies.assignee_name IS '負責人姓名';
COMMENT ON COLUMN store_anomalies.urgency IS '報修緊急程度 low|normal|high|urgent';
COMMENT ON COLUMN store_anomalies.affects_operations IS '報修是否影響營運';
COMMENT ON COLUMN store_disposals.manager_confirmed IS '報廢是否已主管確認';
COMMENT ON COLUMN store_disposals.disposal_reason_code IS '報廢原因代碼';
COMMENT ON COLUMN store_returns.return_target IS '退貨對象（廠商／總部／客戶等）';
COMMENT ON COLUMN store_returns.expected_return_date IS '預計退貨日';
