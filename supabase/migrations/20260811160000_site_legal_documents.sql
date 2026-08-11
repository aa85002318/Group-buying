-- Site help / legal documents managed from admin (privacy, terms, shipping)

CREATE TABLE IF NOT EXISTS site_legal_documents (
  document_key TEXT PRIMARY KEY
    CHECK (document_key IN ('privacy', 'terms', 'shipping')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_format TEXT NOT NULL DEFAULT 'html'
    CHECK (content_format IN ('html', 'plain')),
  document_version TEXT NOT NULL DEFAULT '1.0',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_legal_documents_published
  ON site_legal_documents(is_published);

ALTER TABLE site_legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_legal_documents_public_read ON site_legal_documents;
CREATE POLICY site_legal_documents_public_read ON site_legal_documents
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS site_legal_documents_staff ON site_legal_documents;
CREATE POLICY site_legal_documents_staff ON site_legal_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor', 'customer_service')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor', 'customer_service')
    )
  );

INSERT INTO site_legal_documents (document_key, title, content, content_format, is_published)
VALUES
  ('privacy', '隱私權政策', '', 'html', FALSE),
  ('terms', '服務條款', '', 'html', FALSE),
  ('shipping', '配送說明', '', 'plain', FALSE)
ON CONFLICT (document_key) DO NOTHING;

-- Copy existing shipping copy if present
UPDATE site_legal_documents d
SET
  content = s.shipping_info,
  is_published = TRUE,
  updated_at = NOW()
FROM support_settings s
WHERE d.document_key = 'shipping'
  AND s.settings_key = 'default'
  AND COALESCE(s.shipping_info, '') <> ''
  AND COALESCE(d.content, '') = '';

COMMENT ON TABLE site_legal_documents IS 'Admin-managed privacy, terms, and shipping copy for storefront pages';
