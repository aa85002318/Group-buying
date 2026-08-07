-- Member gift phase 2: eligibility fields, designated store, per-store redeem, reversal

-- ---------------------------------------------------------------------------
-- Campaign eligibility / store exclusion columns
-- ---------------------------------------------------------------------------
ALTER TABLE gift_campaigns DROP CONSTRAINT IF EXISTS gift_campaigns_eligibility_type_check;
ALTER TABLE gift_campaigns
  ADD CONSTRAINT gift_campaigns_eligibility_type_check
  CHECK (eligibility_type IN (
    'all_members',
    'member_levels',
    'member_list',
    'birthday_month',
    'new_members',
    'spend_threshold',
    'points_threshold',
    'member_tags',
    'registration_date',
    'verified_contact'
  ));

ALTER TABLE gift_campaigns
  ADD COLUMN IF NOT EXISTS eligible_member_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS eligibility_registered_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eligibility_registered_to TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS require_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS require_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS excluded_store_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spend_mode TEXT NOT NULL DEFAULT 'single_order'
    CHECK (spend_mode IN ('single_order', 'period_accumulate')),
  ADD COLUMN IF NOT EXISTS applicable_product_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_category_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_product_ids UUID[] DEFAULT '{}';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS member_tags TEXT[] DEFAULT '{}';

ALTER TABLE member_gift_claims
  ADD COLUMN IF NOT EXISTS designated_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reverse_reason TEXT,
  ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_member_gift_claims_designated_store
  ON member_gift_claims(designated_store_id)
  WHERE designated_store_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Atomic redeem with shared + per-store inventory
-- ---------------------------------------------------------------------------
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
  v_store_inv gift_campaign_store_inventory%ROWTYPE;
  v_redemption_number TEXT;
  v_inv_store_id UUID;
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
    UPDATE member_gift_claims SET status = 'expired', updated_at = NOW()
    WHERE id = v_claim.id AND status = 'available';
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

  -- Excluded stores
  IF COALESCE(array_length(v_campaign.excluded_store_ids, 1), 0) > 0
     AND p_store_id = ANY (v_campaign.excluded_store_ids) THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'store_mismatch';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Applicable redemption stores
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

  -- Designated store / cross-store rules
  IF v_claim.designated_store_id IS NOT NULL
     AND v_claim.designated_store_id <> p_store_id
     AND NOT COALESCE(v_campaign.allow_cross_store_redeem, FALSE) THEN
    claim_id := v_claim.id;
    already_redeemed := FALSE;
    failure_code := 'store_mismatch';
    RETURN NEXT;
    RETURN;
  END IF;

  v_inv_store_id := COALESCE(v_claim.designated_store_id, p_store_id);

  -- Per-store inventory lock + deduct
  IF COALESCE(v_campaign.inventory_scope, 'shared') = 'per_store' THEN
    SELECT * INTO v_store_inv
    FROM gift_campaign_store_inventory
    WHERE campaign_id = v_campaign.id AND store_id = v_inv_store_id
    FOR UPDATE;

    IF NOT FOUND THEN
      claim_id := v_claim.id;
      already_redeemed := FALSE;
      failure_code := 'out_of_stock';
      RETURN NEXT;
      RETURN;
    END IF;

    IF v_campaign.inventory_reservation_mode = 'reserve_on_claim' THEN
      UPDATE gift_campaign_store_inventory
      SET
        reserved_quantity = GREATEST(0, reserved_quantity - v_claim.quantity),
        redeemed_quantity = redeemed_quantity + v_claim.quantity,
        updated_at = NOW()
      WHERE id = v_store_inv.id
        AND reserved_quantity >= v_claim.quantity
        AND reserved_quantity + redeemed_quantity <= allocated_quantity;
      IF NOT FOUND THEN
        -- fallback: try deduct from remaining (no prior reserve)
        UPDATE gift_campaign_store_inventory
        SET
          redeemed_quantity = redeemed_quantity + v_claim.quantity,
          updated_at = NOW()
        WHERE id = v_store_inv.id
          AND reserved_quantity + redeemed_quantity + v_claim.quantity <= allocated_quantity;
        IF NOT FOUND THEN
          claim_id := v_claim.id;
          already_redeemed := FALSE;
          failure_code := 'out_of_stock';
          RETURN NEXT;
          RETURN;
        END IF;
      END IF;
    ELSE
      UPDATE gift_campaign_store_inventory
      SET
        redeemed_quantity = redeemed_quantity + v_claim.quantity,
        updated_at = NOW()
      WHERE id = v_store_inv.id
        AND reserved_quantity + redeemed_quantity + v_claim.quantity <= allocated_quantity;
      IF NOT FOUND THEN
        claim_id := v_claim.id;
        already_redeemed := FALSE;
        failure_code := 'out_of_stock';
        RETURN NEXT;
        RETURN;
      END IF;
    END IF;
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

  -- Shared campaign totals (always track campaign-level redeemed)
  IF v_campaign.inventory_reservation_mode = 'reserve_on_claim' THEN
    UPDATE gift_campaigns
    SET
      reserved_quantity = GREATEST(0, reserved_quantity - v_claim.quantity),
      redeemed_quantity = redeemed_quantity + v_claim.quantity,
      updated_at = NOW()
    WHERE id = v_campaign.id;
  ELSE
    IF COALESCE(v_campaign.inventory_scope, 'shared') = 'shared' THEN
      UPDATE gift_campaigns
      SET
        redeemed_quantity = redeemed_quantity + v_claim.quantity,
        updated_at = NOW()
      WHERE id = v_campaign.id
        AND redeemed_quantity + reserved_quantity + v_claim.quantity <= total_quantity;
      IF NOT FOUND THEN
        UPDATE member_gift_claims
        SET status = 'available', redeemed_at = NULL, redemption_number = NULL,
            redeemed_store_id = NULL, redeemed_by = NULL,
            redeemed_store_name_snapshot = NULL, redeemed_staff_code_snapshot = NULL,
            updated_at = NOW()
        WHERE id = v_claim.id;
        claim_id := v_claim.id;
        already_redeemed := FALSE;
        failure_code := 'out_of_stock';
        RETURN NEXT;
        RETURN;
      END IF;
    ELSE
      UPDATE gift_campaigns
      SET
        redeemed_quantity = redeemed_quantity + v_claim.quantity,
        updated_at = NOW()
      WHERE id = v_campaign.id;
    END IF;
  END IF;

  INSERT INTO gift_redemption_logs (
    claim_id, campaign_id, member_id, order_id, store_id, staff_id,
    action, result, idempotency_key, meta
  ) VALUES (
    v_claim.id, v_claim.campaign_id, v_claim.member_id, v_claim.source_order_id,
    p_store_id, p_staff_id, 'redeem', 'success', p_idempotency_key,
    jsonb_build_object(
      'redemption_number', v_redemption_number,
      'quantity', v_claim.quantity,
      'inventory_scope', COALESCE(v_campaign.inventory_scope, 'shared'),
      'inventory_store_id', v_inv_store_id
    )
  );

  claim_id := v_claim.id;
  already_redeemed := FALSE;
  failure_code := NULL;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION redeem_member_gift_claim(UUID, UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_member_gift_claim(UUID, UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Reversal (沖銷): admin only via service_role; keeps audit trail
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reverse_member_gift_redemption(
  p_claim_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_restore_inventory BOOLEAN DEFAULT TRUE,
  p_reactivate_voucher BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  claim_id UUID,
  failure_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_claim member_gift_claims%ROWTYPE;
  v_campaign gift_campaigns%ROWTYPE;
  v_inv_store_id UUID;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 2 THEN
    claim_id := p_claim_id;
    failure_code := 'reason_required';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO v_claim FROM member_gift_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    claim_id := NULL;
    failure_code := 'not_found';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_claim.status <> 'redeemed' THEN
    claim_id := v_claim.id;
    failure_code := 'not_redeemed';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO v_campaign FROM gift_campaigns WHERE id = v_claim.campaign_id FOR UPDATE;
  IF NOT FOUND THEN
    claim_id := v_claim.id;
    failure_code := 'campaign_inactive';
    RETURN NEXT;
    RETURN;
  END IF;

  v_inv_store_id := COALESCE(v_claim.designated_store_id, v_claim.redeemed_store_id);

  IF p_restore_inventory THEN
    IF COALESCE(v_campaign.inventory_scope, 'shared') = 'per_store' AND v_inv_store_id IS NOT NULL THEN
      UPDATE gift_campaign_store_inventory
      SET
        redeemed_quantity = GREATEST(0, redeemed_quantity - v_claim.quantity),
        reserved_quantity = CASE
          WHEN p_reactivate_voucher AND v_campaign.inventory_reservation_mode = 'reserve_on_claim'
            THEN reserved_quantity + v_claim.quantity
          ELSE reserved_quantity
        END,
        updated_at = NOW()
      WHERE campaign_id = v_campaign.id AND store_id = v_inv_store_id;
    END IF;

    IF v_campaign.inventory_reservation_mode = 'reserve_on_claim' AND p_reactivate_voucher THEN
      UPDATE gift_campaigns
      SET
        redeemed_quantity = GREATEST(0, redeemed_quantity - v_claim.quantity),
        reserved_quantity = reserved_quantity + v_claim.quantity,
        updated_at = NOW()
      WHERE id = v_campaign.id;
    ELSE
      UPDATE gift_campaigns
      SET
        redeemed_quantity = GREATEST(0, redeemed_quantity - v_claim.quantity),
        updated_at = NOW()
      WHERE id = v_campaign.id;
    END IF;
  END IF;

  IF p_reactivate_voucher THEN
    UPDATE member_gift_claims
    SET
      status = 'available',
      redeemed_at = NULL,
      redeemed_store_id = NULL,
      redeemed_store_name_snapshot = NULL,
      redeemed_by = NULL,
      redeemed_staff_code_snapshot = NULL,
      redemption_number = NULL,
      reversed_at = NOW(),
      reverse_reason = p_reason,
      reversed_by = p_admin_id,
      updated_at = NOW()
    WHERE id = v_claim.id;
  ELSE
    UPDATE member_gift_claims
    SET
      status = 'cancelled',
      cancelled_at = NOW(),
      cancelled_reason = p_reason,
      voided_at = NOW(),
      void_reason = p_reason,
      voided_by = p_admin_id,
      reversed_at = NOW(),
      reverse_reason = p_reason,
      reversed_by = p_admin_id,
      updated_at = NOW()
    WHERE id = v_claim.id;
  END IF;

  INSERT INTO gift_redemption_logs (
    claim_id, campaign_id, member_id, order_id, store_id, staff_id,
    action, result, failure_reason, meta
  ) VALUES (
    v_claim.id, v_claim.campaign_id, v_claim.member_id, v_claim.source_order_id,
    v_claim.redeemed_store_id, p_admin_id, 'reversal', 'success', p_reason,
    jsonb_build_object(
      'restore_inventory', p_restore_inventory,
      'reactivate_voucher', p_reactivate_voucher,
      'prior_redemption_number', v_claim.redemption_number,
      'prior_redeemed_at', v_claim.redeemed_at
    )
  );

  claim_id := v_claim.id;
  failure_code := NULL;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION reverse_member_gift_redemption(UUID, UUID, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reverse_member_gift_redemption(UUID, UUID, TEXT, BOOLEAN, BOOLEAN) TO service_role;
