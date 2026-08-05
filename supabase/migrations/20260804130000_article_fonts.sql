-- Per-article typography (from shared brand font catalog)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS title_font TEXT,
  ADD COLUMN IF NOT EXISTS body_font TEXT;

COMMENT ON COLUMN articles.title_font IS 'BrandFontId for article title';
COMMENT ON COLUMN articles.body_font IS 'BrandFontId for article body';
