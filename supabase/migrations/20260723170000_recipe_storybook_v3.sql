-- Recipe Story Book V3: per-page teacher questions + gallery privacy

ALTER TABLE public.recipe_discussions
  ADD COLUMN IF NOT EXISTS story_page_id UUID
    REFERENCES public.recipe_story_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_discussions_story_page
  ON public.recipe_discussions (story_page_id)
  WHERE story_page_id IS NOT NULL;

COMMENT ON COLUMN public.recipe_discussions.story_page_id IS
  'Story Book page that the student asked about (我要提問)';

-- Ensure share_to_community is the source of truth for public gallery
COMMENT ON COLUMN public.recipe_submissions.share_to_community IS
  'true = 公開作品牆（審核後顯示）；false = 僅自己可見的作品集';
