-- Homepage layout versioning (draft / scheduled / published / archived)
-- Optional structured table. App also stores versions in site_settings keys
-- (homepage_layout_draft / homepage_layout_history / homepage_layout_scheduled)
-- so draft/publish works before this migration is applied.

CREATE TABLE IF NOT EXISTS homepage_layout_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  label TEXT,
  note TEXT,
  -- Full snapshot of homepage_blocks rows (array of objects)
  blocks_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_layout_versions_one_draft
  ON homepage_layout_versions ((status))
  WHERE status = 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_layout_versions_one_published
  ON homepage_layout_versions ((status))
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_homepage_layout_versions_status
  ON homepage_layout_versions(status, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_homepage_layout_versions_scheduled
  ON homepage_layout_versions(scheduled_at)
  WHERE status = 'scheduled';

DROP TRIGGER IF EXISTS set_updated_at ON homepage_layout_versions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON homepage_layout_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE homepage_layout_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homepage_layout_versions_admin ON homepage_layout_versions;
CREATE POLICY homepage_layout_versions_admin ON homepage_layout_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

-- Public can only read published metadata if needed (snapshot not required on client)
DROP POLICY IF EXISTS homepage_layout_versions_public_read ON homepage_layout_versions;
CREATE POLICY homepage_layout_versions_public_read ON homepage_layout_versions
  FOR SELECT USING (status = 'published');

-- Seed from current live homepage_blocks if empty
DO $$
DECLARE
  snap JSONB;
  ver INT := 1;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM homepage_layout_versions LIMIT 1) THEN
    SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.sort_order), '[]'::jsonb)
      INTO snap
      FROM homepage_blocks b;

    INSERT INTO homepage_layout_versions (
      version_number, status, label, note, blocks_snapshot, published_at
    ) VALUES (
      ver, 'published', '初始發布版', '由現有 homepage_blocks 自動建立', snap, NOW()
    );

    INSERT INTO homepage_layout_versions (
      version_number, status, label, note, blocks_snapshot
    ) VALUES (
      ver + 1, 'draft', '草稿', '可編輯後發布', snap
    );
  END IF;
END $$;
