-- Recipe media: direct file upload fields; deprecate YouTube/Vimeo as writable sources.
-- Legacy youtube/vimeo values remain allowed in CHECK for migration compatibility only.

-- ---------------------------------------------------------------------------
-- 1) recipe_media columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_media
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS start_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS end_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS subtitle_language TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_label TEXT,
  ADD COLUMN IF NOT EXISTS upload_status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'ready';

ALTER TABLE public.recipe_media
  ALTER COLUMN url DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_media_source_type_check'
      AND conrelid = 'public.recipe_media'::regclass
  ) THEN
    ALTER TABLE public.recipe_media DROP CONSTRAINT recipe_media_source_type_check;
  END IF;
END $$;

ALTER TABLE public.recipe_media
  ADD CONSTRAINT recipe_media_source_type_check
  CHECK (source_type IN ('upload', 'storage', 'cdn', 'youtube', 'vimeo'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_media_upload_status_check'
      AND conrelid = 'public.recipe_media'::regclass
  ) THEN
    ALTER TABLE public.recipe_media DROP CONSTRAINT recipe_media_upload_status_check;
  END IF;
END $$;

ALTER TABLE public.recipe_media
  ADD CONSTRAINT recipe_media_upload_status_check
  CHECK (upload_status IN (
    'pending', 'uploading', 'processing', 'completed', 'failed'
  ));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_media_processing_status_check'
      AND conrelid = 'public.recipe_media'::regclass
  ) THEN
    ALTER TABLE public.recipe_media DROP CONSTRAINT recipe_media_processing_status_check;
  END IF;
END $$;

ALTER TABLE public.recipe_media
  ADD CONSTRAINT recipe_media_processing_status_check
  CHECK (processing_status IN (
    'ready', 'placeholder', 'migration_required', 'processing', 'failed'
  ));

-- Mark legacy embed sources inactive — do not delete production rows
UPDATE public.recipe_media
SET
  processing_status = 'migration_required',
  is_active = false,
  upload_status = COALESCE(NULLIF(upload_status, ''), 'completed')
WHERE source_type IN ('youtube', 'vimeo')
  AND COALESCE(processing_status, 'ready') <> 'migration_required';

-- ---------------------------------------------------------------------------
-- 2) recipe_story_page_media: clip refs + upload metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_story_page_media
  ADD COLUMN IF NOT EXISTS source_media_id UUID REFERENCES public.recipe_media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS start_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS end_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS upload_status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'ready';

ALTER TABLE public.recipe_story_page_media
  ALTER COLUMN url DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_story_page_media_source_type_check'
      AND conrelid = 'public.recipe_story_page_media'::regclass
  ) THEN
    ALTER TABLE public.recipe_story_page_media DROP CONSTRAINT recipe_story_page_media_source_type_check;
  END IF;
END $$;

ALTER TABLE public.recipe_story_page_media
  ADD CONSTRAINT recipe_story_page_media_source_type_check
  CHECK (source_type IN ('upload', 'storage', 'cdn', 'youtube', 'vimeo'));

UPDATE public.recipe_story_page_media
SET
  processing_status = 'migration_required',
  active = false
WHERE source_type IN ('youtube', 'vimeo');

CREATE INDEX IF NOT EXISTS idx_recipe_story_page_media_source
  ON public.recipe_story_page_media (source_media_id)
  WHERE source_media_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) Storage bucket: allow larger instructional videos + MOV
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'text/vtt'
  ]
WHERE id = 'recipe-media';
