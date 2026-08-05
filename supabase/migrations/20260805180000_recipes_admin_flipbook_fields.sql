-- Additive: recipe admin flipbook fields (allergens, access, preview status, seed_key)
-- Safe to re-run

-- ---------------------------------------------------------------------------
-- recipes: allergens + access_permission
-- ---------------------------------------------------------------------------
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS access_permission TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_access_permission_check'
  ) THEN
    ALTER TABLE recipes
      ADD CONSTRAINT recipes_access_permission_check
      CHECK (
        access_permission IN (
          'public',
          'member',
          'membership',
          'purchase',
          'code',
          'allowlist',
          'scheduled_access'
        )
      );
  END IF;
END $$;

-- Expand status CHECK to include preview (drop inline/old constraint by name discovery)
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE rel.relname = 'recipes'
    AND nsp.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%'
    AND pg_get_constraintdef(con.oid) ILIKE '%draft%'
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE recipes DROP CONSTRAINT %I', cname);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_status_check'
  ) THEN
    ALTER TABLE recipes
      ADD CONSTRAINT recipes_status_check
      CHECK (status IN ('draft', 'preview', 'scheduled', 'published', 'archived'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- seed_key on child tables (idempotent flipbook seeding)
-- ---------------------------------------------------------------------------
ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS seed_key TEXT;

ALTER TABLE recipe_steps
  ADD COLUMN IF NOT EXISTS seed_key TEXT;

ALTER TABLE recipe_tools
  ADD COLUMN IF NOT EXISTS seed_key TEXT;

ALTER TABLE recipe_story_pages
  ADD COLUMN IF NOT EXISTS seed_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recipe_ingredients_seed_key
  ON recipe_ingredients (recipe_id, seed_key)
  WHERE seed_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recipe_steps_seed_key
  ON recipe_steps (recipe_id, seed_key)
  WHERE seed_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recipe_tools_seed_key
  ON recipe_tools (recipe_id, seed_key)
  WHERE seed_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recipe_story_pages_seed_key
  ON recipe_story_pages (recipe_id, seed_key)
  WHERE seed_key IS NOT NULL;
