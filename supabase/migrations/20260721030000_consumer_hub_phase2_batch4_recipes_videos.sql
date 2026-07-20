-- Consumer Hub 2.0 Batch 4: recipes CMS + video content fields
-- Safe to re-run

-- ---------------------------------------------------------------------------
-- recipe_categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_categories_active_sort
  ON recipe_categories(is_active, sort_order);

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  cover_image TEXT,
  category_id UUID REFERENCES recipe_categories(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prep_time INT,
  cook_time INT,
  total_time INT,
  servings TEXT,
  content TEXT,
  tips TEXT,
  storage_method TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  related_video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_status_published
  ON recipes(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_featured ON recipes(is_featured) WHERE is_featured = true;

DROP TRIGGER IF EXISTS set_updated_at ON recipes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON recipe_categories;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON recipe_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- recipe_ingredients
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  group_name TEXT,
  name TEXT NOT NULL,
  amount TEXT,
  unit TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe
  ON recipe_ingredients(recipe_id, sort_order);

DROP TRIGGER IF EXISTS set_updated_at ON recipe_ingredients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- recipe_steps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INT NOT NULL DEFAULT 1,
  title TEXT,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  note TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe
  ON recipe_steps(recipe_id, sort_order);

DROP TRIGGER IF EXISTS set_updated_at ON recipe_steps;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON recipe_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- videos: content platform fields (extend existing table)
-- ---------------------------------------------------------------------------
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'youtube'
    CHECK (video_type IS NULL OR video_type IN ('youtube', 'facebook', 'external', 'self_hosted')),
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS related_recipe_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_product_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'
    CHECK (status IS NULL OR status IN ('draft', 'scheduled', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_slug_unique
  ON videos(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- Backfill slug from id when missing
UPDATE videos
SET slug = 'video-' || REPLACE(id::text, '-', '')
WHERE slug IS NULL OR slug = '';

UPDATE videos
SET status = CASE WHEN is_active THEN 'published' ELSE 'archived' END
WHERE status IS NULL;

UPDATE videos
SET published_at = COALESCE(published_at, created_at)
WHERE status = 'published' AND published_at IS NULL;

-- ---------------------------------------------------------------------------
-- Seed recipe categories
-- ---------------------------------------------------------------------------
INSERT INTO recipe_categories (name, slug, sort_order)
VALUES
  ('全部', 'all', 0),
  ('蛋糕', 'cake', 10),
  ('麵包', 'bread', 20),
  ('餅乾', 'cookie', 30),
  ('塔類', 'tart', 40),
  ('中式點心', 'chinese', 50),
  ('親子烘焙', 'kids', 60),
  ('烘焙知識', 'knowledge', 70)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_categories_public_read ON recipe_categories;
CREATE POLICY recipe_categories_public_read ON recipe_categories
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS recipe_categories_admin_write ON recipe_categories;
CREATE POLICY recipe_categories_admin_write ON recipe_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS recipes_public_read ON recipes;
CREATE POLICY recipes_public_read ON recipes
  FOR SELECT USING (
    (status = 'published' AND (published_at IS NULL OR published_at <= NOW()))
    OR is_admin()
  );

DROP POLICY IF EXISTS recipes_admin_write ON recipes;
CREATE POLICY recipes_admin_write ON recipes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS recipe_ingredients_public_read ON recipe_ingredients;
CREATE POLICY recipe_ingredients_public_read ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (
          (r.status = 'published' AND (r.published_at IS NULL OR r.published_at <= NOW()))
          OR is_admin()
        )
    )
  );

DROP POLICY IF EXISTS recipe_ingredients_admin_write ON recipe_ingredients;
CREATE POLICY recipe_ingredients_admin_write ON recipe_ingredients
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS recipe_steps_public_read ON recipe_steps;
CREATE POLICY recipe_steps_public_read ON recipe_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
        AND (
          (r.status = 'published' AND (r.published_at IS NULL OR r.published_at <= NOW()))
          OR is_admin()
        )
    )
  );

DROP POLICY IF EXISTS recipe_steps_admin_write ON recipe_steps;
CREATE POLICY recipe_steps_admin_write ON recipe_steps
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Update videos public read to also respect status when present
DROP POLICY IF EXISTS videos_public_read ON videos;
CREATE POLICY videos_public_read ON videos
  FOR SELECT USING (
    (is_active = true AND (status IS NULL OR status = 'published'))
    OR is_admin()
  );
