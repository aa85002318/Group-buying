-- De-identified AI analytics + private failure-photo bucket

CREATE TABLE IF NOT EXISTS ai_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  tool TEXT,
  label TEXT,
  usage_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Taipei')::date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_day_type
  ON ai_analytics_events(usage_date, event_type);

ALTER TABLE ai_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_analytics_admin ON ai_analytics_events;
CREATE POLICY ai_analytics_admin ON ai_analytics_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-failure-photos',
  'ai-failure-photos',
  false,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON TABLE ai_analytics_events IS 'De-identified AI funnel stats; no user/email/phone/order ids';
