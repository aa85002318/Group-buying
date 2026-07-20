-- Phase 4: Smart Baking Platform foundations
-- Safe additive migration — does not drop Phase 1–3 tables

-- ---------------------------------------------------------------------------
-- baking_courses + enrollments + tickets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS baking_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  teacher_name TEXT NOT NULL,
  teacher_image_url TEXT,
  cover_image_url TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  location TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 12,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  waitlist_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baking_courses_active ON baking_courses(is_active, sort_order);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES baking_courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'waitlisted', 'cancelled', 'checked_in', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
  amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);

CREATE TABLE IF NOT EXISTS course_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL UNIQUE REFERENCES course_enrollments(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- corporate inquiries + corporate accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporate_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  inquiry_type TEXT NOT NULL DEFAULT 'afternoon_tea'
    CHECK (inquiry_type IN ('afternoon_tea', 'bulk_order', 'welfare', 'custom_box', 'partnership', 'other')),
  headcount INTEGER,
  budget_range TEXT,
  preferred_date TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'contacted', 'quoted', 'won', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corporate_inquiries_status ON corporate_inquiries(status, created_at DESC);

CREATE TABLE IF NOT EXISTS corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  tax_id TEXT,
  billing_address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- product views + recommendation helpers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id, viewed_at DESC);

-- ---------------------------------------------------------------------------
-- newsletter / subscription preferences (extend notification prefs conceptually)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  new_products BOOLEAN NOT NULL DEFAULT true,
  livestreams BOOLEAN NOT NULL DEFAULT true,
  courses BOOLEAN NOT NULL DEFAULT true,
  newsletter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- CMS banners (homepage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  badge_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- media library metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  folder TEXT DEFAULT 'general',
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder, created_at DESC);

-- ---------------------------------------------------------------------------
-- SEO overrides
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  reference_id TEXT,
  path TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  og_image TEXT,
  noindex BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- login audit (security)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- livestream enhancements
-- ---------------------------------------------------------------------------
ALTER TABLE livestreams
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS replay_url TEXT,
  ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS reading_minutes INTEGER;

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON baking_courses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON baking_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON course_enrollments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON corporate_inquiries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON corporate_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON corporate_accounts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON corporate_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON marketing_subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON marketing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON cms_banners;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cms_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE baking_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS baking_courses_public_read ON baking_courses;
CREATE POLICY baking_courses_public_read ON baking_courses
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS baking_courses_admin ON baking_courses;
CREATE POLICY baking_courses_admin ON baking_courses FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS course_enrollments_own ON course_enrollments;
CREATE POLICY course_enrollments_own ON course_enrollments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS course_enrollments_admin ON course_enrollments;
CREATE POLICY course_enrollments_admin ON course_enrollments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS course_tickets_own ON course_tickets;
CREATE POLICY course_tickets_own ON course_tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM course_enrollments e
    WHERE e.id = enrollment_id AND e.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS course_tickets_admin ON course_tickets;
CREATE POLICY course_tickets_admin ON course_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS corporate_inquiries_insert ON corporate_inquiries;
CREATE POLICY corporate_inquiries_insert ON corporate_inquiries
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS corporate_inquiries_own ON corporate_inquiries;
CREATE POLICY corporate_inquiries_own ON corporate_inquiries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS corporate_inquiries_admin ON corporate_inquiries;
CREATE POLICY corporate_inquiries_admin ON corporate_inquiries FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS corporate_accounts_own ON corporate_accounts;
CREATE POLICY corporate_accounts_own ON corporate_accounts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS corporate_accounts_admin ON corporate_accounts;
CREATE POLICY corporate_accounts_admin ON corporate_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS product_views_own ON product_views;
CREATE POLICY product_views_own ON product_views FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS marketing_subscriptions_own ON marketing_subscriptions;
CREATE POLICY marketing_subscriptions_own ON marketing_subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS cms_banners_public_read ON cms_banners;
CREATE POLICY cms_banners_public_read ON cms_banners
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS cms_banners_admin ON cms_banners;
CREATE POLICY cms_banners_admin ON cms_banners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS media_assets_admin ON media_assets;
CREATE POLICY media_assets_admin ON media_assets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS seo_pages_public_read ON seo_pages;
CREATE POLICY seo_pages_public_read ON seo_pages FOR SELECT USING (true);

DROP POLICY IF EXISTS seo_pages_admin ON seo_pages;
CREATE POLICY seo_pages_admin ON seo_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS login_events_admin ON login_events;
CREATE POLICY login_events_admin ON login_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Seed sample courses if empty
INSERT INTO baking_courses (title, slug, description, teacher_name, start_at, location, price, capacity, enrolled_count)
SELECT * FROM (VALUES
  ('基礎麵包入門｜揉麵與發酵實作', 'basic-bread', '從零開始學會揉麵與發酵，帶回家的不只是麵包。', '棋美老師', NOW() + INTERVAL '14 days', '棋美點心屋教室', 1800, 12, 4),
  ('蛋糕裝飾工作坊｜奶油霜擠花', 'cake-decorating', '學習基礎奶油霜調色與擠花技巧。', '棋美老師', NOW() + INTERVAL '21 days', '棋美點心屋教室', 2200, 10, 7),
  ('胖姐烘焙教室｜家常甜點', 'pangjie-home-sweets', '一分鐘教你在家做，適合初學者。', '胖姐', NOW() + INTERVAL '28 days', '線上＋門市', 0, 30, 12)
) AS v(title, slug, description, teacher_name, start_at, location, price, capacity, enrolled_count)
WHERE NOT EXISTS (SELECT 1 FROM baking_courses LIMIT 1);
