-- Member account privacy suite: phone verification, preferred store,
-- legal consents, login devices, data export audit

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pending_phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_change_code TEXT,
  ADD COLUMN IF NOT EXISTS phone_change_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marketing_email_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_line_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_sms_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_store
  ON profiles(preferred_store_id)
  WHERE preferred_store_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS member_legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_key TEXT NOT NULL CHECK (document_key IN ('privacy', 'terms', 'marketing')),
  document_version TEXT NOT NULL DEFAULT '1.0',
  agreed BOOLEAN NOT NULL DEFAULT TRUE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE (user_id, document_key, document_version)
);

CREATE INDEX IF NOT EXISTS idx_member_legal_consents_user
  ON member_legal_consents(user_id, agreed_at DESC);

CREATE TABLE IF NOT EXISTS member_login_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_label TEXT,
  user_agent TEXT,
  ip_address TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_member_login_devices_user
  ON member_login_devices(user_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS member_data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_member_data_export_user
  ON member_data_export_requests(user_id, requested_at DESC);

ALTER TABLE member_legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_login_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_data_export_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_legal_consents_own ON member_legal_consents;
CREATE POLICY member_legal_consents_own ON member_legal_consents FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS member_login_devices_own ON member_login_devices;
CREATE POLICY member_login_devices_own ON member_login_devices FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS member_data_export_own ON member_data_export_requests;
CREATE POLICY member_data_export_own ON member_data_export_requests FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN profiles.phone_verified IS 'Whether the current phone number has been verified by the member';
COMMENT ON COLUMN profiles.preferred_store_id IS 'Default store for pickup preference';
