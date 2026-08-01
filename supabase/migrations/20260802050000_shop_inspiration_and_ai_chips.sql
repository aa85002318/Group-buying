-- Shop hub: baking inspiration wall + AI assistant chips

CREATE TABLE IF NOT EXISTS public.shop_inspiration_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'community'
    CHECK (category IN ('community', 'recipe', 'teacher', 'tip')),
  card_type text NOT NULL DEFAULT 'community'
    CHECK (card_type IN ('community', 'recipe', 'teacher', 'tip')),
  title text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  aspect text NOT NULL DEFAULT '4/5'
    CHECK (aspect IN ('1/1', '4/5', '3/4')),
  author_name text NOT NULL DEFAULT 'CHIMEIDIY',
  author_avatar text,
  time_label text,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  materials text[] NOT NULL DEFAULT '{}',
  rating numeric(2,1) NOT NULL DEFAULT 5,
  difficulty text,
  cook_time text,
  tip_body text,
  product_name text,
  product_href text,
  href text NOT NULL DEFAULT '/recipes',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_inspiration_posts_active_sort_idx
  ON public.shop_inspiration_posts (is_active, sort_order);

CREATE TABLE IF NOT EXISTS public.shop_ai_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  emoji text NOT NULL DEFAULT '✨',
  prompt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_ai_chips_active_sort_idx
  ON public.shop_ai_chips (is_active, sort_order);

-- Seed inspiration posts if empty
INSERT INTO public.shop_inspiration_posts (
  category, card_type, title, image_url, aspect, author_name, time_label,
  likes, comments, materials, rating, difficulty, cook_time, tip_body,
  product_name, product_href, href, is_featured, sort_order, is_active
)
SELECT * FROM (VALUES
  ('community', 'community', '草莓鮮奶油蛋糕', '/images/home/group-buy-banner/slide-dessert.png', '4/5', '小麥烘焙日記', '2小時前', 128, 16, ARRAY['低筋麵粉','鮮奶油']::text[], 5.0, NULL, NULL, NULL, NULL, NULL, '/recipes', true, 1, true),
  ('recipe', 'recipe', '超柔軟生吐司', '/images/home/group-buy-banner/slide-snack.png', '1/1', '麵包控', NULL, 86, 9, ARRAY['高筋麵粉','奶油']::text[], 5.0, '中等', '約 3.5 小時', NULL, NULL, NULL, '/recipes', true, 2, true),
  ('teacher', 'teacher', '香草藍莓奶霜蛋糕捲', '/images/home/latest-campaigns/02-group-buy.jpg', '3/4', '珊珊老師', NULL, 210, 24, ARRAY['鮮奶油']::text[], 5.0, NULL, NULL, NULL, NULL, NULL, '/recipes', true, 3, true),
  ('community', 'community', '經典巧克力餅乾', '/images/home/group-buy-banner/slide-season.png', '1/1', '甜點控小鹿', '昨天', 96, 11, ARRAY['耐烤巧克力豆']::text[], 4.0, NULL, NULL, NULL, NULL, NULL, '/recipes', false, 4, true),
  ('tip', 'tip', '第一次做餅乾成功！', '/images/home/group-buy-banner/slide-kitchen.png', '3/4', '烘焙小白', '3天前', 64, 8, ARRAY['法國發酵奶油']::text[], 5.0, NULL, NULL, '溫度控好、冷藏夠久，餅乾邊緣酥脆中間軟！推薦這款奶油。', '法國發酵奶油', '/shop/categories', '/articles', false, 5, true),
  ('teacher', 'teacher', '脆皮泡芙', '/images/home/latest-campaigns/03-live.jpg', '4/5', '米蘭老師', NULL, 178, 19, ARRAY['泡芙預拌粉']::text[], 5.0, NULL, NULL, NULL, NULL, NULL, '/recipes', true, 6, true),
  ('recipe', 'recipe', '香酥可頌蛋塔', '/images/shop/promo/spring-5x2.jpg', '1/1', 'CHIMEIDIY', NULL, 142, 14, ARRAY['冷凍可頌']::text[], 4.0, '簡單', '約 45 分鐘', NULL, NULL, NULL, '/recipes', false, 7, true),
  ('community', 'community', '伯爵司康', '/images/home/latest-campaigns/01-free-shipping.jpg', '4/5', 'Baking Life', '5小時前', 73, 7, ARRAY['伯爵茶粉']::text[], 5.0, NULL, NULL, NULL, NULL, NULL, '/recipes', false, 8, true)
) AS v(
  category, card_type, title, image_url, aspect, author_name, time_label,
  likes, comments, materials, rating, difficulty, cook_time, tip_body,
  product_name, product_href, href, is_featured, sort_order, is_active
)
WHERE NOT EXISTS (SELECT 1 FROM public.shop_inspiration_posts LIMIT 1);

-- Seed AI chips if empty
INSERT INTO public.shop_ai_chips (label, emoji, prompt, sort_order, is_active)
SELECT * FROM (VALUES
  ('想做生吐司', '🥖', '想做生吐司', 1, true),
  ('乳酪蛋糕', '🍰', '乳酪蛋糕', 2, true),
  ('簡單餅乾', '🍪', '簡單餅乾', 3, true),
  ('馬芬蛋糕', '🧁', '馬芬', 4, true),
  ('可頌', '🥐', '可頌', 5, true),
  ('佛卡夏', '🍞', '佛卡夏', 6, true)
) AS v(label, emoji, prompt, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.shop_ai_chips LIMIT 1);

ALTER TABLE public.shop_inspiration_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_ai_chips ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY shop_inspiration_posts_public_read ON public.shop_inspiration_posts
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY shop_inspiration_posts_admin_all ON public.shop_inspiration_posts
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

DO $$ BEGIN
  CREATE POLICY shop_ai_chips_public_read ON public.shop_ai_chips
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY shop_ai_chips_admin_all ON public.shop_ai_chips
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
