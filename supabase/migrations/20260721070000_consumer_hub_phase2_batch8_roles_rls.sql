-- Consumer Hub 2.0 Batch 8: role helpers + RLS hardening notes
-- Safe to re-run. Does not create POS tables.
--
-- IMPORTANT: profiles.role is enum user_role. New values must be added first.
-- If SQL Editor runs this as one transaction, functions use role::text so
-- CREATE FUNCTION does not require the new enum literals in the same txn.
-- Prefer running the ALTER TYPE statements alone first, then the rest.

-- ---------------------------------------------------------------------------
-- Extend user_role enum (run these first if a previous attempt failed)
-- ---------------------------------------------------------------------------
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'content_editor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer_service';

-- App routes gate content_editor / customer_service via middleware +
-- requireContentAdmin / requireOpsAdmin.
-- Existing policies that call is_admin() remain admin-only (intentional).

CREATE OR REPLACE FUNCTION public.is_content_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'content_editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_customer_service()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'customer_service', 'store_staff')
  );
$$;

COMMENT ON FUNCTION public.is_content_editor() IS
  'True for admin or content_editor — recipes/news/videos/CMS';
COMMENT ON FUNCTION public.is_customer_service() IS
  'True for admin, customer_service, or store_staff — App orders / member ops';

-- Favorites / addresses / notifications: re-assert own policies (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
    ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS favorites_own ON favorites;
    CREATE POLICY favorites_own ON favorites FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_addresses') THEN
    ALTER TABLE member_addresses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS member_addresses_own ON member_addresses;
    CREATE POLICY member_addresses_own ON member_addresses FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS notifications_own ON notifications;
    CREATE POLICY notifications_own ON notifications FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS notifications_admin ON notifications;
    CREATE POLICY notifications_admin ON notifications FOR ALL
      USING (is_admin()) WITH CHECK (is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_carriers') THEN
    ALTER TABLE invoice_carriers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS invoice_carriers_own ON invoice_carriers;
    CREATE POLICY invoice_carriers_own ON invoice_carriers FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
