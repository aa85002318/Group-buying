-- Additive: video / article recipe modes (staging-first)
-- Does NOT drop existing columns or rewrite legacy storybook data.

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS recipe_type TEXT;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS seo_image TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'recipes_recipe_type_check'
  ) THEN
    ALTER TABLE public.recipes
      ADD CONSTRAINT recipes_recipe_type_check
      CHECK (recipe_type IS NULL OR recipe_type IN ('video', 'article'));
  END IF;
END $$;

COMMENT ON COLUMN public.recipes.recipe_type IS
  'Simplified content mode: video | article. NULL = legacy / inferred.';
COMMENT ON COLUMN public.recipes.youtube_url IS
  'YouTube watch/shorts/share URL for video recipes.';
COMMENT ON COLUMN public.recipes.video_url IS
  'Self-hosted or uploaded video URL for video recipes.';
COMMENT ON COLUMN public.recipes.seo_image IS
  'Optional OG image; falls back to cover_image when null.';
