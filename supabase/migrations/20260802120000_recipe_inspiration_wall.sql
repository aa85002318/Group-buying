-- Shop Version C — recipe-backed 烘焙靈感牆 fields
-- Note: recipes.difficulty already exists as text (easy|medium|hard).
-- Star difficulty for the wall uses inspiration_difficulty (1–5).

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS show_in_inspiration_wall boolean NOT NULL DEFAULT false;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_featured_inspiration boolean NOT NULL DEFAULT false;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS inspiration_sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS inspiration_category text;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS inspiration_difficulty integer;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS ingredient_product_ids uuid[];

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS inspiration_use_ip_image boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'recipes_inspiration_difficulty_check'
  ) THEN
    ALTER TABLE public.recipes
      ADD CONSTRAINT recipes_inspiration_difficulty_check
      CHECK (
        inspiration_difficulty IS NULL
        OR (inspiration_difficulty BETWEEN 1 AND 5)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recipes_inspiration_wall
  ON public.recipes (show_in_inspiration_wall, inspiration_sort_order)
  WHERE show_in_inspiration_wall = true;

CREATE INDEX IF NOT EXISTS idx_recipes_featured_inspiration
  ON public.recipes (is_featured_inspiration, inspiration_sort_order)
  WHERE is_featured_inspiration = true;
