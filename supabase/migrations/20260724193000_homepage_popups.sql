-- Homepage popup announcements (首頁彈跳公告)
-- Safe to re-run

CREATE TABLE IF NOT EXISTS homepage_popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  desktop_image_url TEXT,
  mobile_image_url TEXT,
  button_text TEXT NOT NULL DEFAULT '立即查看',
  link_type TEXT NOT NULL DEFAULT 'internal'
    CHECK (link_type IN (
      'internal', 'external',
      'product', 'category', 'group_buy', 'recipe', 'article',
      'news', 'video', 'course', 'ai_tools', 'member', 'support', 'custom'
    )),
  link_url TEXT,
  linked_resource_id TEXT,
  display_scope TEXT NOT NULL DEFAULT 'home_only'
    CHECK (display_scope IN ('home_only', 'site_first_open')),
  audience_type TEXT NOT NULL DEFAULT 'all'
    CHECK (audience_type IN ('all', 'guest', 'member')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('emergency', 'high', 'normal', 'low')),
  priority_rank INT NOT NULL DEFAULT 50,
  allow_close BOOLEAN NOT NULL DEFAULT true,
  allow_close_on_backdrop BOOLEAN NOT NULL DEFAULT true,
  allow_dismiss_today BOOLEAN NOT NULL DEFAULT true,
  dismiss_after_click BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'ended', 'disabled')),
  view_count INT NOT NULL DEFAULT 0,
  click_count INT NOT NULL DEFAULT 0,
  close_count INT NOT NULL DEFAULT 0,
  dismiss_today_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_popups_status ON homepage_popups(status);
CREATE INDEX IF NOT EXISTS idx_homepage_popups_schedule ON homepage_popups(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_homepage_popups_priority ON homepage_popups(priority_rank DESC, starts_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON homepage_popups;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON homepage_popups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS homepage_popup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id UUID NOT NULL REFERENCES homepage_popups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'close', 'dismiss_today')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_popup_events_popup ON homepage_popup_events(popup_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_popup_events_type ON homepage_popup_events(popup_id, event_type);

ALTER TABLE homepage_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_popup_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS homepage_popups_admin_all ON homepage_popups;
CREATE POLICY homepage_popups_admin_all ON homepage_popups
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Public may not SELECT drafts via PostgREST; active fetch goes through service API.
DROP POLICY IF EXISTS homepage_popups_public_read_active ON homepage_popups;
CREATE POLICY homepage_popups_public_read_active ON homepage_popups
  FOR SELECT USING (
    status = 'active'
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

DROP POLICY IF EXISTS homepage_popup_events_admin_select ON homepage_popup_events;
CREATE POLICY homepage_popup_events_admin_select ON homepage_popup_events
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS homepage_popup_events_insert ON homepage_popup_events;
CREATE POLICY homepage_popup_events_insert ON homepage_popup_events
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE homepage_popups IS '首頁彈跳公告（CMS）';
COMMENT ON TABLE homepage_popup_events IS '彈跳公告曝光／點擊／關閉統計（獨立於通知中心）';
