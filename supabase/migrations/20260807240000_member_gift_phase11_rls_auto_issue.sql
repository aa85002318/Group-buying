-- Member gift phase 11: align RLS with marketing / store / audit roles

-- Campaigns: marketing write; staff+audit+manager read
DROP POLICY IF EXISTS gift_campaigns_admin_all ON gift_campaigns;
CREATE POLICY gift_campaigns_admin_all ON gift_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  );

DROP POLICY IF EXISTS gift_campaigns_staff_read ON gift_campaigns;
CREATE POLICY gift_campaigns_staff_read ON gift_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('store_staff', 'store_manager', 'admin', 'customer_service', 'content_editor')
    )
  );

-- Claims: admin write; marketing read; staff/manager/audit read
DROP POLICY IF EXISTS member_gift_claims_admin_all ON member_gift_claims;
CREATE POLICY member_gift_claims_admin_all ON member_gift_claims FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS member_gift_claims_marketing_read ON member_gift_claims;
CREATE POLICY member_gift_claims_marketing_read ON member_gift_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('content_editor', 'customer_service')
    )
  );

DROP POLICY IF EXISTS member_gift_claims_staff_read ON member_gift_claims;
CREATE POLICY member_gift_claims_staff_read ON member_gift_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('store_staff', 'store_manager', 'admin', 'customer_service')
    )
  );

-- Logs
DROP POLICY IF EXISTS gift_redemption_logs_admin_all ON gift_redemption_logs;
CREATE POLICY gift_redemption_logs_admin_all ON gift_redemption_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS gift_redemption_logs_staff_read ON gift_redemption_logs;
CREATE POLICY gift_redemption_logs_staff_read ON gift_redemption_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('store_staff', 'store_manager', 'admin', 'customer_service', 'content_editor')
    )
  );

-- Items: marketing write; members read published; staff read
DROP POLICY IF EXISTS gift_items_admin_all ON gift_campaign_items;
CREATE POLICY gift_items_admin_all ON gift_campaign_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  );

DROP POLICY IF EXISTS gift_items_staff_read ON gift_campaign_items;
CREATE POLICY gift_items_staff_read ON gift_campaign_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('store_staff', 'store_manager', 'admin', 'customer_service')
    )
  );

-- Store inventory: marketing+admin write; staff/manager read
DROP POLICY IF EXISTS gift_store_inv_admin_all ON gift_campaign_store_inventory;
CREATE POLICY gift_store_inv_admin_all ON gift_campaign_store_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  );

DROP POLICY IF EXISTS gift_store_inv_staff_read ON gift_campaign_store_inventory;
CREATE POLICY gift_store_inv_staff_read ON gift_campaign_store_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('store_staff', 'store_manager', 'admin', 'customer_service')
    )
  );

-- Reversal requests: also allow store_manager role explicitly (if enum present)
DROP POLICY IF EXISTS gift_reversal_manager_read ON gift_reversal_requests;
CREATE POLICY gift_reversal_manager_read ON gift_reversal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_manager', 'customer_service')
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
