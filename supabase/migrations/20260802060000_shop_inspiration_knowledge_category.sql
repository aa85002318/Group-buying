-- Add 「烘焙知識」 category to shop inspiration wall

ALTER TABLE public.shop_inspiration_posts
  DROP CONSTRAINT IF EXISTS shop_inspiration_posts_category_check;

ALTER TABLE public.shop_inspiration_posts
  DROP CONSTRAINT IF EXISTS shop_inspiration_posts_card_type_check;

ALTER TABLE public.shop_inspiration_posts
  ADD CONSTRAINT shop_inspiration_posts_category_check
  CHECK (category IN ('community', 'recipe', 'teacher', 'tip', 'knowledge'));

ALTER TABLE public.shop_inspiration_posts
  ADD CONSTRAINT shop_inspiration_posts_card_type_check
  CHECK (card_type IN ('community', 'recipe', 'teacher', 'tip', 'knowledge'));

INSERT INTO public.shop_inspiration_posts (
  category, card_type, title, image_url, aspect, author_name, time_label,
  likes, comments, materials, rating, cook_time, tip_body, href, is_featured, sort_order, is_active
)
SELECT
  'knowledge', 'knowledge', '低筋／中筋／高筋怎麼選？',
  '/images/home/group-buy-banner/slide-kitchen.png', '1/1', 'CHIMEIDIY', NULL,
  112, 12, ARRAY['高筋麵粉','低筋麵粉']::text[], 5.0, '閱讀 3 分鐘',
  '筋性決定成品結構：吐司選高筋、蛋糕選低筋，搞懂就不易失敗。',
  '/articles', true, 9, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.shop_inspiration_posts WHERE title = '低筋／中筋／高筋怎麼選？'
);
