-- Refine recipe video upload: metadata, demo flags, path-safe checks.
-- Idempotent / additive only.

ALTER TABLE public.recipe_media
  ADD COLUMN IF NOT EXISTS upload_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_key TEXT;

ALTER TABLE public.recipe_story_page_media
  ADD COLUMN IF NOT EXISTS upload_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_key TEXT;

-- Clip / size checks (null allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_media_start_seconds_check'
      AND conrelid = 'public.recipe_media'::regclass
  ) THEN
    ALTER TABLE public.recipe_media
      ADD CONSTRAINT recipe_media_start_seconds_check
      CHECK (start_seconds IS NULL OR start_seconds >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_media_end_after_start_check'
      AND conrelid = 'public.recipe_media'::regclass
  ) THEN
    ALTER TABLE public.recipe_media
      ADD CONSTRAINT recipe_media_end_after_start_check
      CHECK (
        end_seconds IS NULL
        OR start_seconds IS NULL
        OR end_seconds > start_seconds
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_media_file_size_check'
      AND conrelid = 'public.recipe_media'::regclass
  ) THEN
    ALTER TABLE public.recipe_media
      ADD CONSTRAINT recipe_media_file_size_check
      CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);
  END IF;
END $$;

-- Ensure legacy youtube stays inactive / migration_required
UPDATE public.recipe_media
SET
  processing_status = 'migration_required',
  is_active = false
WHERE source_type IN ('youtube', 'vimeo')
  AND (is_active = true OR COALESCE(processing_status, '') <> 'migration_required');

CREATE INDEX IF NOT EXISTS idx_recipe_media_seed_key
  ON public.recipe_media (seed_key)
  WHERE seed_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_media_demo_placeholder
  ON public.recipe_media (recipe_id)
  WHERE is_demo = true AND processing_status = 'placeholder';
