-- Store profile hub: shared fields for /stores, APP pickup, maps, social, hours, gallery, SEO
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS line_at TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS weekly_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS holidays JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pickup_hours TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS announcements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS service_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS visibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_code_unique
  ON stores (code)
  WHERE code IS NOT NULL AND code <> '';

CREATE INDEX IF NOT EXISTS idx_stores_slug_seo
  ON stores ((seo->>'slug'))
  WHERE (seo->>'slug') IS NOT NULL AND (seo->>'slug') <> '';

COMMENT ON COLUMN stores.code IS '分店代碼（內部／APP）';
COMMENT ON COLUMN stores.weekly_hours IS '一週營業時間 {mon:{open,close,closed},...}';
COMMENT ON COLUMN stores.holidays IS '特殊公休 [{date,label}]';
COMMENT ON COLUMN stores.social_links IS '社群 [{platform,url,icon,visible}]';
COMMENT ON COLUMN stores.gallery IS '門市圖片 [{id,category,url,sort_order,caption}]';
COMMENT ON COLUMN stores.announcements IS '門市公告 [{id,body,visible,starts_at,ends_at}]';
COMMENT ON COLUMN stores.seo IS '{title,description,og_image,slug}';
COMMENT ON COLUMN stores.service_flags IS '服務開關：pickup/frozen/chilled/parking/accessible/corporate/classroom';
COMMENT ON COLUMN stores.visibility IS '顯示開關：website/app/pwa + show_phone/hours/social/map/gallery/announcements';

-- Backfill map/navigation aliases and cover from image_url
UPDATE stores
SET map_url = COALESCE(NULLIF(map_url, ''), NULLIF(navigation_url, ''))
WHERE (map_url IS NULL OR map_url = '')
  AND navigation_url IS NOT NULL
  AND navigation_url <> '';

UPDATE stores
SET cover_image_url = COALESCE(NULLIF(cover_image_url, ''), NULLIF(image_url, ''))
WHERE (cover_image_url IS NULL OR cover_image_url = '')
  AND image_url IS NOT NULL
  AND image_url <> '';

UPDATE stores
SET visibility = jsonb_build_object(
  'website', true,
  'app', true,
  'pwa', true,
  'show_phone', true,
  'show_hours', true,
  'show_social', true,
  'show_map', true,
  'show_gallery', true,
  'show_announcements', true
)
WHERE visibility = '{}'::jsonb OR visibility IS NULL;

UPDATE stores
SET service_flags = jsonb_build_object(
  'pickup', COALESCE(pickup_available, true),
  'frozen', false,
  'chilled', false,
  'parking', false,
  'accessible', false,
  'corporate', false,
  'classroom', false
)
WHERE service_flags = '{}'::jsonb OR service_flags IS NULL;
