-- Member gifts / store spend gifts campaigns
-- Additive only. Rollback notes at bottom.

CREATE TABLE IF NOT EXISTS gift_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('monthly_member_gift', 'store_spend_gift')),
  campaign_month TEXT,
  name TEXT NOT NULL,
  gift_name TEXT NOT NULL,
  gift_image_url TEXT,
  description TEXT,
  terms TEXT,
  notes TEXT,
  tag_label TEXT,
  eligibility_type TEXT NOT NULL DEFAULT 'all_members'
    CHECK (eligibility_type IN (
      'all_members', 'member_levels', 'member_list', 'birthday_month',
      'new_members', 'spend_threshold', 'points_threshold'
    )),
  eligible_member_levels TEXT[] DEFAULT '{}',
  eligible_member_ids UUID[] DEFAULT '{}',
  eligibility_min_spend NUMERIC(12,2),
  eligibility_min_points INTEGER,
  minimum_spend NUMERIC(12,2),
  spend_calculation_type TEXT NOT NULL DEFAULT 'paid_ex_shipping'
    CHECK (spend_calculation_type IN (
      'paid_ex_shipping', 'paid_incl_shipping', 'pre_discount', 'category_only'
    )),
  exclude_shipping BOOLEAN NOT NULL DEFAULT TRUE,
  exclude_coupons BOOLEAN NOT NULL DEFAULT FALSE,
  exclude_cancelled BOOLEAN NOT NULL DEFAULT TRUE,
  exclude_refunded BOOLEAN NOT NULL DEFAULT TRUE,
  required_order_statuses TEXT[] DEFAULT ARRAY['completed', 'ready_for_pickup', 'paid']::TEXT[],
  total_quantity INTEGER NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  redeemed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (redeemed_quantity >= 0),
  per_member_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_member_limit >= 1),
  per_order_quantity INTEGER NOT NULL DEFAULT 1 CHECK (per_order_quantity >= 1),
  is_stackable BOOLEAN NOT NULL DEFAULT FALSE,
  stack_limit INTEGER,
  inventory_reservation_mode TEXT NOT NULL DEFAULT 'reserve_on_claim'
    CHECK (inventory_reservation_mode IN ('reserve_on_claim', 'deduct_on_redeem')),
  applicable_purchase_store_ids UUID[] DEFAULT '{}',
  applicable_redemption_store_ids UUID[] DEFAULT '{}',
  require_same_store_redeem BOOLEAN NOT NULL DEFAULT FALSE,
  display_start_at TIMESTAMPTZ,
  claim_start_at TIMESTAMPTZ,
  claim_end_at TIMESTAMPTZ,
  redeem_start_at TIMESTAMPTZ,
  redeem_end_at TIMESTAMPTZ,
  show_remaining_quantity BOOLEAN NOT NULL DEFAULT TRUE,
  low_stock_threshold INTEGER DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'paused', 'ended')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gift_campaigns_qty_balance CHECK (
    reserved_quantity + redeemed_quantity <= total_quantity
  )
);

CREATE INDEX IF NOT EXISTS idx_gift_campaigns_type_status
  ON gift_campaigns(campaign_type, status, claim_start_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_campaigns_month
  ON gift_campaigns(campaign_month);

DROP TRIGGER IF EXISTS set_updated_at ON gift_campaigns;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON gift_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS member_gift_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES gift_campaigns(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  qualification_amount NUMERIC(12,2),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  issue_sequence INTEGER NOT NULL DEFAULT 1,
  redemption_code TEXT NOT NULL,
  qr_nonce TEXT,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'redeemed', 'expired', 'cancelled')),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  redeemed_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  redeemed_store_name_snapshot TEXT,
  redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_staff_code_snapshot TEXT,
  redemption_number TEXT,
  purchase_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_member_gift_claims_code
  ON member_gift_claims(redemption_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_gift_claims_redemption_number
  ON member_gift_claims(redemption_number)
  WHERE redemption_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_gift_claims_member_campaign_seq
  ON member_gift_claims(member_id, campaign_id, issue_sequence);
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_gift_claims_order_campaign
  ON member_gift_claims(source_order_id, campaign_id)
  WHERE source_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_member_gift_claims_member_status
  ON member_gift_claims(member_id, status, claimed_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_gift_claims_campaign
  ON member_gift_claims(campaign_id, status);

DROP TRIGGER IF EXISTS set_updated_at ON member_gift_claims;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON member_gift_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS gift_redemption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES member_gift_claims(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES gift_campaigns(id) ON DELETE SET NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  failure_reason TEXT,
  idempotency_key TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gift_redemption_logs_idempotency
  ON gift_redemption_logs(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gift_redemption_logs_campaign
  ON gift_redemption_logs(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_redemption_logs_store
  ON gift_redemption_logs(store_id, created_at DESC);

-- Atomic redeem: only when available + not expired + optional store match
CREATE OR REPLACE FUNCTION redeem_member_gift_claim(
  p_claim_id UUID,
  p_store_id UUID,
  p_staff_id UUID,
  p_staff_code TEXT,
  p_store_name TEXT,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  claim_id UUID,
  already_redeemed BOOLEAN,
  failure_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_claim member_gift_claims%ROWTYPE;
  v_campaign gift_campaigns%ROWTYPE;
  v_existing gift_redemption_logs%ROWTYPE;
  v_redemption_number TEXT;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM gift_redemption_logs
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;
    IF FOUND AND v_existing.result = 'success' AND v_existing.claim_id IS NOT NULL THEN
      claim_id := v_existing.claim_id;
      already_redeemed := TRUE;
      failure_code := NULL;
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  SELECT * INTO v_claim FROM member_gift_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    claim_id := NULL;
    already_redeemed := FALSE;
    failure_code := 'not_found';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_claim.status = 'redeemed' THEN
    claim_id := v_claim.id;
    already_redeemed := TRUE;
    failure_code := 'already_redeemed';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_claim.status = 'cancelled' THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'cancelled';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_claim.status = 'expired' OR (v_claim.expires_at IS NOT NULL AND v_claim.expires_at < NOW()) THEN
    UPDATE member_gift_claims SET status = 'expired', updated_at = NOW() WHERE id = v_claim.id AND status = 'available';
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'expired';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO v_campaign FROM gift_campaigns WHERE id = v_claim.campaign_id FOR UPDATE;
  IF NOT FOUND OR v_campaign.status NOT IN ('published', 'ended') THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'campaign_inactive';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_campaign.redeem_start_at IS NOT NULL AND v_campaign.redeem_start_at > NOW() THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'not_started';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_campaign.redeem_end_at IS NOT NULL AND v_campaign.redeem_end_at < NOW() THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'expired';
    RETURN NEXT;
    RETURN;
  END IF;

  IF COALESCE(array_length(v_campaign.applicable_redemption_store_ids, 1), 0) > 0
     AND NOT (p_store_id = ANY (v_campaign.applicable_redemption_store_ids)) THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'store_mismatch';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_campaign.require_same_store_redeem
     AND v_claim.purchase_store_id IS NOT NULL
     AND v_claim.purchase_store_id <> p_store_id THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'store_mismatch';
    RETURN NEXT;
    RETURN;
  END IF;

  v_redemption_number := 'GR' || to_char(NOW(), 'YYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  UPDATE member_gift_claims
  SET
    status = 'redeemed',
    redeemed_at = NOW(),
    redeemed_store_id = p_store_id,
    redeemed_store_name_snapshot = p_store_name,
    redeemed_by = p_staff_id,
    redeemed_staff_code_snapshot = p_staff_code,
    redemption_number = v_redemption_number,
    qr_nonce = NULL,
    updated_at = NOW()
  WHERE id = v_claim.id AND status = 'available';

  IF NOT FOUND THEN
    claim_id := v_claim.id;
    already_redeemed := TRUE;
    failure_code := 'already_redeemed';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_campaign.inventory_reservation_mode = 'reserve_on_claim' THEN
    UPDATE gift_campaigns
    SET
      reserved_quantity = GREATEST(0, reserved_quantity - v_claim.quantity),
      redeemed_quantity = redeemed_quantity + v_claim.quantity,
      updated_at = NOW()
    WHERE id = v_campaign.id;
  ELSE
    UPDATE gift_campaigns
    SET
      redeemed_quantity = redeemed_quantity + v_claim.quantity,
      updated_at = NOW()
    WHERE id = v_campaign.id
      AND redeemed_quantity + reserved_quantity + v_claim.quantity <= total_quantity;
    IF NOT FOUND THEN
      -- rollback claim status
      UPDATE member_gift_claims
      SET status = 'available', redeemed_at = NULL, redemption_number = NULL,
          redeemed_store_id = NULL, redeemed_by = NULL, updated_at = NOW()
      WHERE id = v_claim.id;
      claim_id := v_claim.id;
      already_redeemed := FALSE;
      failure_code := 'out_of_stock';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  INSERT INTO gift_redemption_logs (
    claim_id, campaign_id, member_id, order_id, store_id, staff_id,
    action, result, idempotency_key, meta
  ) VALUES (
    v_claim.id, v_claim.campaign_id, v_claim.member_id, v_claim.source_order_id,
    p_store_id, p_staff_id, 'redeem', 'success', p_idempotency_key,
    jsonb_build_object('redemption_number', v_redemption_number, 'quantity', v_claim.quantity)
  );

  claim_id := v_claim.id;
  already_redeemed := FALSE;
  failure_code := NULL;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION redeem_member_gift_claim(UUID, UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_member_gift_claim(UUID, UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

ALTER TABLE gift_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_gift_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_redemption_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gift_campaigns_admin_all ON gift_campaigns;
CREATE POLICY gift_campaigns_admin_all ON gift_campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS gift_campaigns_member_read ON gift_campaigns;
CREATE POLICY gift_campaigns_member_read ON gift_campaigns FOR SELECT
  USING (status = 'published' OR status = 'ended');

DROP POLICY IF EXISTS gift_campaigns_staff_read ON gift_campaigns;
CREATE POLICY gift_campaigns_staff_read ON gift_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('store_staff', 'admin', 'customer_service')
    )
  );

DROP POLICY IF EXISTS member_gift_claims_admin_all ON member_gift_claims;
CREATE POLICY member_gift_claims_admin_all ON member_gift_claims FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS member_gift_claims_owner_read ON member_gift_claims;
CREATE POLICY member_gift_claims_owner_read ON member_gift_claims FOR SELECT
  USING (member_id = auth.uid());

DROP POLICY IF EXISTS member_gift_claims_staff_read ON member_gift_claims;
CREATE POLICY member_gift_claims_staff_read ON member_gift_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('store_staff', 'admin', 'customer_service')
    )
  );

DROP POLICY IF EXISTS gift_redemption_logs_admin_all ON gift_redemption_logs;
CREATE POLICY gift_redemption_logs_admin_all ON gift_redemption_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS gift_redemption_logs_staff_read ON gift_redemption_logs;
CREATE POLICY gift_redemption_logs_staff_read ON gift_redemption_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('store_staff', 'admin', 'customer_service')
    )
  );

DROP POLICY IF EXISTS gift_redemption_logs_member_read ON gift_redemption_logs;
CREATE POLICY gift_redemption_logs_member_read ON gift_redemption_logs FOR SELECT
  USING (member_id = auth.uid());

-- Rollback (manual):
-- DROP FUNCTION IF EXISTS redeem_member_gift_claim(UUID, UUID, UUID, TEXT, TEXT, TEXT);
-- DROP TABLE IF EXISTS gift_redemption_logs;
-- DROP TABLE IF EXISTS member_gift_claims;
-- DROP TABLE IF EXISTS gift_campaigns;
