-- Smart recipe upgrade P1: extend recipes/ingredients/steps + new related tables
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- Does NOT drop or rename existing columns.

-- ---------------------------------------------------------------------------
-- 1) recipes — smart / flip flags
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS reading_mode_default TEXT NOT NULL DEFAULT 'flip',
  ADD COLUMN IF NOT EXISTS flip_mode_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS full_reading_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_smart_recipe BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ingredient_scaling_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS discussion_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS submission_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_recommendation_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS demo_key TEXT,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_label TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipes_reading_mode_default_check') THEN
    ALTER TABLE public.recipes
      ADD CONSTRAINT recipes_reading_mode_default_check
      CHECK (reading_mode_default IN ('flip', 'full'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_demo_key_unique
  ON public.recipes (demo_key)
  WHERE demo_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_smart
  ON public.recipes (is_smart_recipe)
  WHERE is_smart_recipe = true;

-- ---------------------------------------------------------------------------
-- 2) recipe_ingredients — extend (keep name/amount/unit)
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_ingredients
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS substitution_notes TEXT,
  ADD COLUMN IF NOT EXISTS quantity_numeric NUMERIC,
  ADD COLUMN IF NOT EXISTS used_in_step_ids UUID[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 3) recipe_steps — extend (keep description as body)
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_steps
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS temperature_value NUMERIC,
  ADD COLUMN IF NOT EXISTS temperature_unit TEXT DEFAULT 'C',
  ADD COLUMN IF NOT EXISTS timer_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chef_notes TEXT,
  ADD COLUMN IF NOT EXISTS safety_notes TEXT,
  ADD COLUMN IF NOT EXISTS common_failures JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recovery_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prohibited_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_context TEXT,
  ADD COLUMN IF NOT EXISTS ai_keywords TEXT[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 4) recipe_tools
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_tools_recipe
  ON public.recipe_tools (recipe_id, sort_order);

-- ---------------------------------------------------------------------------
-- 5) recipe_preparations (前置作業)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_preparations_recipe
  ON public.recipe_preparations (recipe_id, sort_order);

-- ---------------------------------------------------------------------------
-- 6) recipe_media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.recipe_steps(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'keyframe')),
  source_type TEXT NOT NULL DEFAULT 'upload'
    CHECK (source_type IN ('upload', 'youtube', 'vimeo', 'cdn')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  subtitle_url TEXT,
  aspect_ratio TEXT,
  duration_seconds INTEGER,
  autoplay BOOLEAN NOT NULL DEFAULT false,
  muted BOOLEAN NOT NULL DEFAULT true,
  loop BOOLEAN NOT NULL DEFAULT false,
  allow_slow_playback BOOLEAN NOT NULL DEFAULT true,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_media_recipe
  ON public.recipe_media (recipe_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_recipe_media_step
  ON public.recipe_media (step_id)
  WHERE step_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 7) recipe_video_markers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_video_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.recipe_media(id) ON DELETE CASCADE,
  time_seconds INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  ai_context TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_video_markers_media
  ON public.recipe_video_markers (media_id, sort_order, time_seconds);

-- ---------------------------------------------------------------------------
-- 8) step ↔ ingredient / tool / AI prompts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_step_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.recipe_steps(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.recipe_ingredients(id) ON DELETE CASCADE,
  notes TEXT,
  UNIQUE (step_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS public.recipe_step_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.recipe_steps(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.recipe_tools(id) ON DELETE CASCADE,
  notes TEXT,
  UNIQUE (step_id, tool_id)
);

CREATE TABLE IF NOT EXISTS public.recipe_step_ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.recipe_steps(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  prompt TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_step_ai_prompts_step
  ON public.recipe_step_ai_prompts (step_id, sort_order);

-- ---------------------------------------------------------------------------
-- 9) product recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.recipe_steps(id) ON DELETE SET NULL,
  ingredient_id UUID REFERENCES public.recipe_ingredients(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL DEFAULT 'ingredient'
    CHECK (recommendation_type IN (
      'ingredient', 'substitute', 'tool', 'decoration',
      'packaging', 'teacher_choice', 'upgrade'
    )),
  recommendation_reason TEXT,
  priority INT NOT NULL DEFAULT 0,
  manual_override BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_product_recs_recipe
  ON public.recipe_product_recommendations (recipe_id, priority DESC);

-- ---------------------------------------------------------------------------
-- 10) FAQ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_faq_recipe
  ON public.recipe_faq (recipe_id, sort_order);

-- ---------------------------------------------------------------------------
-- 11) AI conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.recipe_steps(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  current_media_id UUID REFERENCES public.recipe_media(id) ON DELETE SET NULL,
  current_time_seconds INT,
  current_marker_id UUID REFERENCES public.recipe_video_markers(id) ON DELETE SET NULL,
  recipe_multiplier NUMERIC NOT NULL DEFAULT 1,
  resolved BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ai_conv_recipe
  ON public.recipe_ai_conversations (recipe_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.recipe_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.recipe_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ai_messages_conv
  ON public.recipe_ai_messages (conversation_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- 12) Discussions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'failure', 'substitution', 'oven', 'storage', 'product', 'other')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  step_id UUID REFERENCES public.recipe_steps(id) ON DELETE SET NULL,
  media_id UUID REFERENCES public.recipe_media(id) ON DELETE SET NULL,
  media_time_seconds INT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'answered', 'resolved', 'locked', 'hidden')),
  like_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_discussions_recipe
  ON public.recipe_discussions (recipe_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.recipe_discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.recipe_discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  author_role TEXT NOT NULL DEFAULT 'member'
    CHECK (author_role IN ('member', 'teacher', 'official')),
  is_helpful BOOLEAN NOT NULL DEFAULT false,
  is_best_answer BOOLEAN NOT NULL DEFAULT false,
  like_count INT NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_discussion_replies_disc
  ON public.recipe_discussion_replies (discussion_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- 13) Submissions (成品分享)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT,
  note TEXT,
  rating INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  success_status TEXT NOT NULL DEFAULT 'success'
    CHECK (success_status IN ('success', 'partially_successful', 'needs_improvement')),
  recipe_multiplier NUMERIC NOT NULL DEFAULT 1,
  mold_size TEXT,
  oven_settings TEXT,
  substitutions TEXT,
  made_on DATE,
  share_to_community BOOLEAN NOT NULL DEFAULT false,
  community_post_id UUID,
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden')),
  is_teacher_pick BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_submissions_recipe
  ON public.recipe_submissions (recipe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_submissions_moderation
  ON public.recipe_submissions (moderation_status);

CREATE TABLE IF NOT EXISTS public.recipe_submission_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.recipe_submissions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_submission_images_sub
  ON public.recipe_submission_images (submission_id, sort_order);

-- ---------------------------------------------------------------------------
-- 14) updated_at triggers (reuse existing function when present)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'recipe_tools',
    'recipe_preparations',
    'recipe_media',
    'recipe_video_markers',
    'recipe_step_ai_prompts',
    'recipe_product_recommendations',
    'recipe_faq',
    'recipe_ai_conversations',
    'recipe_discussions',
    'recipe_discussion_replies',
    'recipe_submissions'
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
-- 15) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.recipe_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_video_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_step_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_step_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_step_ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_submission_images ENABLE ROW LEVEL SECURITY;

-- Helper: recipe is publicly readable
-- Policies mirror existing recipe_ingredients pattern (published parent OR admin)

DROP POLICY IF EXISTS recipe_tools_public_read ON public.recipe_tools;
CREATE POLICY recipe_tools_public_read ON public.recipe_tools FOR SELECT USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published')
);
DROP POLICY IF EXISTS recipe_tools_admin_write ON public.recipe_tools;
CREATE POLICY recipe_tools_admin_write ON public.recipe_tools FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_preparations_public_read ON public.recipe_preparations;
CREATE POLICY recipe_preparations_public_read ON public.recipe_preparations FOR SELECT USING (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published')
);
DROP POLICY IF EXISTS recipe_preparations_admin_write ON public.recipe_preparations;
CREATE POLICY recipe_preparations_admin_write ON public.recipe_preparations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_media_public_read ON public.recipe_media;
CREATE POLICY recipe_media_public_read ON public.recipe_media FOR SELECT USING (
  (is_active = true AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published'))
  OR public.is_admin()
);
DROP POLICY IF EXISTS recipe_media_admin_write ON public.recipe_media;
CREATE POLICY recipe_media_admin_write ON public.recipe_media FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_video_markers_public_read ON public.recipe_video_markers;
CREATE POLICY recipe_video_markers_public_read ON public.recipe_video_markers FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_media m
    JOIN public.recipes r ON r.id = m.recipe_id
    WHERE m.id = media_id AND m.is_active = true AND r.status = 'published'
  )
);
DROP POLICY IF EXISTS recipe_video_markers_admin_write ON public.recipe_video_markers;
CREATE POLICY recipe_video_markers_admin_write ON public.recipe_video_markers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_step_ingredients_public_read ON public.recipe_step_ingredients;
CREATE POLICY recipe_step_ingredients_public_read ON public.recipe_step_ingredients FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_steps s
    JOIN public.recipes r ON r.id = s.recipe_id
    WHERE s.id = step_id AND r.status = 'published'
  )
);
DROP POLICY IF EXISTS recipe_step_ingredients_admin_write ON public.recipe_step_ingredients;
CREATE POLICY recipe_step_ingredients_admin_write ON public.recipe_step_ingredients FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_step_tools_public_read ON public.recipe_step_tools;
CREATE POLICY recipe_step_tools_public_read ON public.recipe_step_tools FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_steps s
    JOIN public.recipes r ON r.id = s.recipe_id
    WHERE s.id = step_id AND r.status = 'published'
  )
);
DROP POLICY IF EXISTS recipe_step_tools_admin_write ON public.recipe_step_tools;
CREATE POLICY recipe_step_tools_admin_write ON public.recipe_step_tools FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_step_ai_prompts_public_read ON public.recipe_step_ai_prompts;
CREATE POLICY recipe_step_ai_prompts_public_read ON public.recipe_step_ai_prompts FOR SELECT USING (
  (is_active = true AND EXISTS (
    SELECT 1 FROM public.recipe_steps s
    JOIN public.recipes r ON r.id = s.recipe_id
    WHERE s.id = step_id AND r.status = 'published'
  ))
  OR public.is_admin()
);
DROP POLICY IF EXISTS recipe_step_ai_prompts_admin_write ON public.recipe_step_ai_prompts;
CREATE POLICY recipe_step_ai_prompts_admin_write ON public.recipe_step_ai_prompts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_product_recs_public_read ON public.recipe_product_recommendations;
CREATE POLICY recipe_product_recs_public_read ON public.recipe_product_recommendations FOR SELECT USING (
  (is_active = true AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published'))
  OR public.is_admin()
);
DROP POLICY IF EXISTS recipe_product_recs_admin_write ON public.recipe_product_recommendations;
CREATE POLICY recipe_product_recs_admin_write ON public.recipe_product_recommendations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_faq_public_read ON public.recipe_faq;
CREATE POLICY recipe_faq_public_read ON public.recipe_faq FOR SELECT USING (
  (is_active = true AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published'))
  OR public.is_admin()
);
DROP POLICY IF EXISTS recipe_faq_admin_write ON public.recipe_faq;
CREATE POLICY recipe_faq_admin_write ON public.recipe_faq FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- AI conversations: owner or admin read; insert for authenticated/anon via session
DROP POLICY IF EXISTS recipe_ai_conv_select ON public.recipe_ai_conversations;
CREATE POLICY recipe_ai_conv_select ON public.recipe_ai_conversations FOR SELECT USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR (is_public = true AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published'))
);
DROP POLICY IF EXISTS recipe_ai_conv_insert ON public.recipe_ai_conversations;
CREATE POLICY recipe_ai_conv_insert ON public.recipe_ai_conversations FOR INSERT WITH CHECK (
  user_id IS NULL OR user_id = auth.uid() OR public.is_admin()
);
DROP POLICY IF EXISTS recipe_ai_conv_update ON public.recipe_ai_conversations;
CREATE POLICY recipe_ai_conv_update ON public.recipe_ai_conversations FOR UPDATE USING (
  public.is_admin() OR user_id = auth.uid()
);
DROP POLICY IF EXISTS recipe_ai_conv_admin_all ON public.recipe_ai_conversations;
CREATE POLICY recipe_ai_conv_admin_all ON public.recipe_ai_conversations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_ai_messages_select ON public.recipe_ai_messages;
CREATE POLICY recipe_ai_messages_select ON public.recipe_ai_messages FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_ai_conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.is_public = true OR public.is_admin())
  )
);
DROP POLICY IF EXISTS recipe_ai_messages_insert ON public.recipe_ai_messages;
CREATE POLICY recipe_ai_messages_insert ON public.recipe_ai_messages FOR INSERT WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_ai_conversations c
    WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR c.user_id IS NULL)
  )
);
DROP POLICY IF EXISTS recipe_ai_messages_admin_all ON public.recipe_ai_messages;
CREATE POLICY recipe_ai_messages_admin_all ON public.recipe_ai_messages FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_discussions_public_read ON public.recipe_discussions;
CREATE POLICY recipe_discussions_public_read ON public.recipe_discussions FOR SELECT USING (
  public.is_admin()
  OR (
    status <> 'hidden'
    AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published')
  )
);
DROP POLICY IF EXISTS recipe_discussions_insert ON public.recipe_discussions;
CREATE POLICY recipe_discussions_insert ON public.recipe_discussions FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin())
);
DROP POLICY IF EXISTS recipe_discussions_update_own ON public.recipe_discussions;
CREATE POLICY recipe_discussions_update_own ON public.recipe_discussions FOR UPDATE USING (
  public.is_admin() OR (user_id = auth.uid() AND status NOT IN ('locked', 'hidden'))
);
DROP POLICY IF EXISTS recipe_discussions_admin_all ON public.recipe_discussions;
CREATE POLICY recipe_discussions_admin_all ON public.recipe_discussions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_discussion_replies_public_read ON public.recipe_discussion_replies;
CREATE POLICY recipe_discussion_replies_public_read ON public.recipe_discussion_replies FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_discussions d
    WHERE d.id = discussion_id AND d.status <> 'hidden'
  )
);
DROP POLICY IF EXISTS recipe_discussion_replies_insert ON public.recipe_discussion_replies;
CREATE POLICY recipe_discussion_replies_insert ON public.recipe_discussion_replies FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin())
);
DROP POLICY IF EXISTS recipe_discussion_replies_admin_all ON public.recipe_discussion_replies;
CREATE POLICY recipe_discussion_replies_admin_all ON public.recipe_discussion_replies FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_submissions_public_read ON public.recipe_submissions;
CREATE POLICY recipe_submissions_public_read ON public.recipe_submissions FOR SELECT USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR (
    moderation_status = 'approved'
    AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'published')
  )
);
DROP POLICY IF EXISTS recipe_submissions_insert ON public.recipe_submissions;
CREATE POLICY recipe_submissions_insert ON public.recipe_submissions FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin())
);
DROP POLICY IF EXISTS recipe_submissions_update_own ON public.recipe_submissions;
CREATE POLICY recipe_submissions_update_own ON public.recipe_submissions FOR UPDATE USING (
  public.is_admin() OR (user_id = auth.uid() AND moderation_status = 'pending')
);
DROP POLICY IF EXISTS recipe_submissions_admin_all ON public.recipe_submissions;
CREATE POLICY recipe_submissions_admin_all ON public.recipe_submissions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recipe_submission_images_public_read ON public.recipe_submission_images;
CREATE POLICY recipe_submission_images_public_read ON public.recipe_submission_images FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_submissions s
    WHERE s.id = submission_id
      AND (s.moderation_status = 'approved' OR s.user_id = auth.uid() OR public.is_admin())
  )
);
DROP POLICY IF EXISTS recipe_submission_images_insert ON public.recipe_submission_images;
CREATE POLICY recipe_submission_images_insert ON public.recipe_submission_images FOR INSERT WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_submissions s
    WHERE s.id = submission_id AND s.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS recipe_submission_images_admin_all ON public.recipe_submission_images;
CREATE POLICY recipe_submission_images_admin_all ON public.recipe_submission_images FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 16) Storage bucket for recipe media
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-media',
  'recipe-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'text/vtt']
)
ON CONFLICT (id) DO NOTHING;
