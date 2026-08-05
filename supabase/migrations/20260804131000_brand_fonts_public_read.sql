-- Ensure anon/authenticated can read public brand-fonts
DROP POLICY IF EXISTS brand_fonts_public_read ON storage.objects;
CREATE POLICY brand_fonts_public_read
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'brand-fonts');

DROP POLICY IF EXISTS brand_fonts_anon_read ON storage.objects;
CREATE POLICY brand_fonts_anon_read
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'brand-fonts');
