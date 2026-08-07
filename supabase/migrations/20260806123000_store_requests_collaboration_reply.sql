-- Additive: branch demand collaboration fields + expanded reply statuses
-- Does NOT mutate inventory on create/reply.

ALTER TABLE store_requests
  ADD COLUMN IF NOT EXISTS source_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS reply_note TEXT;

CREATE INDEX IF NOT EXISTS idx_store_requests_source_store
  ON store_requests(source_store_id, status, created_at DESC)
  WHERE source_store_id IS NOT NULL;

DO $$
BEGIN
  ALTER TABLE store_requests DROP CONSTRAINT IF EXISTS store_requests_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE store_requests
  DROP CONSTRAINT IF EXISTS store_requests_status_check;

ALTER TABLE store_requests
  ADD CONSTRAINT store_requests_status_check
  CHECK (
    status IN (
      'pending',
      'approved',
      'partial',
      'rejected',
      'arranged',
      'handed_over',
      'fulfilled',
      'cancelled'
    )
  );

COMMENT ON COLUMN store_requests.source_store_id IS '希望來源門市（跨店需求）；回覆不直接扣庫存';
COMMENT ON COLUMN store_requests.reply_quantity IS '來源門市回覆可供應數量（部分供應時使用）';
COMMENT ON COLUMN store_requests.reply_note IS '來源門市回覆說明';
COMMENT ON TABLE store_requests IS
  '門市協作：分店貨品需求／缺貨通知。回覆僅更新狀態，不直接修改其他分店庫存。';
