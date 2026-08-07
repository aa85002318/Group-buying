-- Per-store company disclosure (JSONB). Soft-fail in API if not applied.
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS disclosure JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN stores.disclosure IS
  '公司揭露 {company_name,tax_id,representative,registered_address,note}；僅 admin 可改';
