-- Allow content_editor to manage media_assets (admin client already bypasses RLS;
-- this keeps direct client access consistent).

DROP POLICY IF EXISTS media_assets_admin ON media_assets;
CREATE POLICY media_assets_admin ON media_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor')
    )
  );
