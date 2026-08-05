-- Additive fields for content-first recipe editor + auto flipbook sync
-- Safe to re-run

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS bake_time INTEGER;

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS story_layout_mode TEXT NOT NULL DEFAULT 'auto';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_story_layout_mode_check'
  ) THEN
    ALTER TABLE recipes
      ADD CONSTRAINT recipes_story_layout_mode_check
      CHECK (story_layout_mode IN ('auto', 'manual'));
  END IF;
END $$;

ALTER TABLE recipe_tools
  ADD COLUMN IF NOT EXISTS quantity INTEGER;

ALTER TABLE recipe_steps
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN recipes.bake_time IS '烘烤時間（分鐘），與 prep_time / cook_time 分開';
COMMENT ON COLUMN recipes.story_layout_mode IS 'auto=依內容同步翻頁；manual=進階手動編輯';
COMMENT ON COLUMN recipe_tools.quantity IS '器具數量';
COMMENT ON COLUMN recipe_steps.video_url IS '步驟選填影片 URL';
