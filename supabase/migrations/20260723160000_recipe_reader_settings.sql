-- Recipe Story Book V3: reader settings for immersive course mode

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS reader_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.recipes.reader_settings IS
  'Story Book reader flags: fullscreen, showToc, showAskTeacher, showChallenge, showGallery, showProducts, showCautionPopup, showCompletionBadge';
