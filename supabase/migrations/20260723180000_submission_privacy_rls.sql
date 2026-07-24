-- Private submissions must not appear in public gallery APIs / RLS

DROP POLICY IF EXISTS recipe_submissions_public_read ON public.recipe_submissions;
CREATE POLICY recipe_submissions_public_read ON public.recipe_submissions FOR SELECT USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR (
    share_to_community = true
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.status = 'published'
    )
  )
);

DROP POLICY IF EXISTS recipe_submission_images_public_read ON public.recipe_submission_images;
CREATE POLICY recipe_submission_images_public_read ON public.recipe_submission_images FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.recipe_submissions s
    WHERE s.id = submission_id
      AND (
        s.user_id = auth.uid()
        OR public.is_admin()
        OR (s.share_to_community = true AND s.moderation_status = 'approved')
      )
  )
);

-- Soft-deactivate celebration completion pages in DEMO recipes (safe; no content delete)
UPDATE public.recipe_story_pages
SET active = false, updated_at = now()
WHERE page_type = 'completion'
  AND (
    title ILIKE '%恭喜完成%'
    OR title ILIKE '%謝謝觀看%'
    OR title ILIKE '%DEMO%食譜%'
  );
