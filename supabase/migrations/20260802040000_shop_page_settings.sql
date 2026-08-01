-- Shop page appearance settings (header / hero colors)

CREATE TABLE IF NOT EXISTS public.shop_page_settings (
  singleton_key text PRIMARY KEY DEFAULT 'main',
  header_bg_color text NOT NULL DEFAULT '#FFD84D'
    CHECK (header_bg_color ~ '^#[0-9A-Fa-f]{6}$'),
  hero_bg_color text NOT NULL DEFAULT '#FFD84D'
    CHECK (hero_bg_color ~ '^#[0-9A-Fa-f]{6}$'),
  header_border_color text
    CHECK (header_border_color IS NULL OR header_border_color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.shop_page_settings (singleton_key, header_bg_color, hero_bg_color, header_border_color)
VALUES ('main', '#FFD84D', '#FFD84D', NULL)
ON CONFLICT (singleton_key) DO NOTHING;

ALTER TABLE public.shop_page_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY shop_page_settings_public_read ON public.shop_page_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY shop_page_settings_admin_write ON public.shop_page_settings
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
