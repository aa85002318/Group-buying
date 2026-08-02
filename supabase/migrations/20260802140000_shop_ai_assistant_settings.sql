-- Shop AI Recipe Assistant (Version A) — singleton CMS settings

CREATE TABLE IF NOT EXISTS public.shop_ai_assistant_settings (
  singleton_key text PRIMARY KEY DEFAULT 'main',
  is_visible boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT '想做什麼？告訴 AI 吧！',
  subtitle text NOT NULL DEFAULT '輸入食材、口味或製作時間，AI 幫你找到適合的食譜。',
  placeholder text NOT NULL DEFAULT '例如：雞蛋、牛奶、30分鐘、巧克力...',
  cta_text text NOT NULL DEFAULT '去問 AI',
  cta_href text NOT NULL DEFAULT '/ai',
  ip_image_url text NOT NULL DEFAULT '/branding/chimeidiy-ip-angel.png',
  background_image_url text,
  background_color text NOT NULL DEFAULT '#FFF8E8'
    CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  popular_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.shop_ai_assistant_settings (
  singleton_key, is_visible, title, subtitle, placeholder, cta_text, cta_href,
  ip_image_url, background_color, popular_tags
) VALUES (
  'main',
  true,
  '想做什麼？告訴 AI 吧！',
  '輸入食材、口味或製作時間，AI 幫你找到適合的食譜。',
  '例如：雞蛋、牛奶、30分鐘、巧克力...',
  '去問 AI',
  '/ai',
  '/branding/chimeidiy-ip-angel.png',
  '#FFF8E8',
  '[
    {"id":"t1","label":"雞蛋","prompt":"家裡只有雞蛋可以做什麼？","emoji":"🥚","sort_order":1,"is_active":true},
    {"id":"t2","label":"巧克力","prompt":"巧克力怎麼消耗？","emoji":"🍫","sort_order":2,"is_active":true},
    {"id":"t3","label":"30分鐘內","prompt":"我只有30分鐘，可以做什麼甜點？","emoji":"⏱","sort_order":3,"is_active":true},
    {"id":"t4","label":"生日蛋糕","prompt":"適合新手的生日蛋糕？","emoji":"🎂","sort_order":4,"is_active":true},
    {"id":"t5","label":"無麩質","prompt":"無麩質可以做什麼甜點？","emoji":"🌿","sort_order":5,"is_active":true},
    {"id":"t6","label":"吐司變身","prompt":"吐司可以變什麼甜點？","emoji":"🍞","sort_order":6,"is_active":true},
    {"id":"t7","label":"可頌靈感","prompt":"可頌還可以做什麼？","emoji":"🥐","sort_order":7,"is_active":true}
  ]'::jsonb
)
ON CONFLICT (singleton_key) DO NOTHING;

ALTER TABLE public.shop_ai_assistant_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY shop_ai_assistant_settings_public_read
    ON public.shop_ai_assistant_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY shop_ai_assistant_settings_admin_write
    ON public.shop_ai_assistant_settings
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'content_editor')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'content_editor')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
