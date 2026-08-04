-- Public bucket for brand / UI fonts (website + APP + PWA share branding)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-fonts',
  'brand-fonts',
  true,
  67108864, -- 64MB per file
  ARRAY[
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/font-sfnt',
    'application/x-font-ttf',
    'application/octet-stream'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS brand_fonts_public_read ON storage.objects;
CREATE POLICY brand_fonts_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-fonts');

DROP POLICY IF EXISTS brand_fonts_admin_write ON storage.objects;
CREATE POLICY brand_fonts_admin_write
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'brand-fonts'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    bucket_id = 'brand-fonts'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  );
