-- Recipe Story Book V3: dedicated teacher Q&A (我要提問)

CREATE TABLE IF NOT EXISTS public.recipe_teacher_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_page_id UUID REFERENCES public.recipe_story_pages(id) ON DELETE SET NULL,
  step_id UUID REFERENCES public.recipe_steps(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  photo_url TEXT,
  teacher_reply TEXT,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  student_notified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'answered', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_teacher_questions_recipe
  ON public.recipe_teacher_questions (recipe_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_teacher_questions_user
  ON public.recipe_teacher_questions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_teacher_questions_open
  ON public.recipe_teacher_questions (recipe_id, status)
  WHERE status = 'open';

COMMENT ON TABLE public.recipe_teacher_questions IS
  'Story Book V3 我要提問 — per-page teacher Q&A with photo and reply notification';

ALTER TABLE public.recipe_teacher_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_teacher_questions_select ON public.recipe_teacher_questions;
CREATE POLICY recipe_teacher_questions_select ON public.recipe_teacher_questions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor')
    )
  );

DROP POLICY IF EXISTS recipe_teacher_questions_insert ON public.recipe_teacher_questions;
CREATE POLICY recipe_teacher_questions_insert ON public.recipe_teacher_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS recipe_teacher_questions_update_own ON public.recipe_teacher_questions;
CREATE POLICY recipe_teacher_questions_update_own ON public.recipe_teacher_questions
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor')
    )
  );

DROP TRIGGER IF EXISTS set_updated_at ON public.recipe_teacher_questions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recipe_teacher_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
