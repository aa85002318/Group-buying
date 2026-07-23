-- Recipe Storybook: chapters / pages / page media
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ---------------------------------------------------------------------------
-- 1) Chapters
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_story_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  chapter_number INT,
  cover_image TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_story_chapters_recipe
  ON public.recipe_story_chapters (recipe_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2) Story pages (separate from recipe_steps; a step may map to many pages)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_story_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.recipe_story_chapters(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.recipe_steps(id) ON DELETE SET NULL,
  page_type TEXT NOT NULL,
  layout_type TEXT NOT NULL DEFAULT 'full_bleed',
  title TEXT,
  subtitle TEXT,
  body TEXT,
  eyebrow TEXT,
  alignment TEXT DEFAULT 'bottom_left'
    CHECK (alignment IS NULL OR alignment IN ('top_left', 'bottom_left', 'center', 'bottom_right')),
  content_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  completion_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_context TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_story_pages_recipe
  ON public.recipe_story_pages (recipe_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_recipe_story_pages_chapter
  ON public.recipe_story_pages (chapter_id, sort_order)
  WHERE chapter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipe_story_pages_step
  ON public.recipe_story_pages (step_id)
  WHERE step_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) Page media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_story_page_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_page_id UUID NOT NULL REFERENCES public.recipe_story_pages(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'keyframe')),
  source_type TEXT NOT NULL DEFAULT 'upload'
    CHECK (source_type IN ('upload', 'youtube', 'vimeo', 'cdn')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  subtitle_url TEXT,
  caption TEXT,
  alt_text TEXT,
  duration_seconds INT,
  focal_point_x NUMERIC,
  focal_point_y NUMERIC,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_story_page_media_page
  ON public.recipe_story_page_media (story_page_id, sort_order);

-- ---------------------------------------------------------------------------
-- 4) Link existing recipe_media → story page (optional)
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_media
  ADD COLUMN IF NOT EXISTS story_page_id UUID REFERENCES public.recipe_story_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_media_story_page
  ON public.recipe_media (story_page_id)
  WHERE story_page_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5) updated_at triggers
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'recipe_story_chapters',
    'recipe_story_pages',
    'recipe_story_page_media'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_story_page_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_story_chapters_public_read ON public.recipe_story_chapters;
CREATE POLICY recipe_story_chapters_public_read ON public.recipe_story_chapters FOR SELECT USING (
  public.is_admin()
  OR (
    active = true
    AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published')
  )
);
DROP POLICY IF EXISTS recipe_story_chapters_admin_write ON public.recipe_story_chapters;
CREATE POLICY recipe_story_chapters_admin_write ON public.recipe_story_chapters FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_story_pages_public_read ON public.recipe_story_pages;
CREATE POLICY recipe_story_pages_public_read ON public.recipe_story_pages FOR SELECT USING (
  public.is_admin()
  OR (
    active = true
    AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published')
  )
);
DROP POLICY IF EXISTS recipe_story_pages_admin_write ON public.recipe_story_pages;
CREATE POLICY recipe_story_pages_admin_write ON public.recipe_story_pages FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_story_page_media_public_read ON public.recipe_story_page_media;
CREATE POLICY recipe_story_page_media_public_read ON public.recipe_story_page_media FOR SELECT USING (
  public.is_admin()
  OR (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.recipe_story_pages p
      JOIN public.recipes r ON r.id = p.recipe_id
      WHERE p.id = story_page_id AND p.active = true AND r.status = 'published'
    )
  )
);
DROP POLICY IF EXISTS recipe_story_page_media_admin_write ON public.recipe_story_page_media;
CREATE POLICY recipe_story_page_media_admin_write ON public.recipe_story_page_media FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
