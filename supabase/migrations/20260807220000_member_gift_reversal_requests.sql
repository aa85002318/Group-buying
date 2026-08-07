-- Member gift phase 5: reversal request workflow (store_manager applies, admin approves)

CREATE TABLE IF NOT EXISTS gift_reversal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES member_gift_claims(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES gift_campaigns(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  restore_inventory BOOLEAN NOT NULL DEFAULT TRUE,
  reactivate_voucher BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_reversal_req_status
  ON gift_reversal_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_reversal_req_claim
  ON gift_reversal_requests(claim_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gift_reversal_req_pending_claim
  ON gift_reversal_requests(claim_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS set_updated_at ON gift_reversal_requests;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON gift_reversal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE gift_reversal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gift_reversal_admin_all ON gift_reversal_requests;
CREATE POLICY gift_reversal_admin_all ON gift_reversal_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS gift_reversal_manager_read ON gift_reversal_requests;
CREATE POLICY gift_reversal_manager_read ON gift_reversal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_manager', 'store_staff', 'customer_service')
    )
  );

DROP POLICY IF EXISTS gift_reversal_manager_insert ON gift_reversal_requests;
CREATE POLICY gift_reversal_manager_insert ON gift_reversal_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_manager')
    )
  );
