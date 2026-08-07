-- Cross-store collaboration notifications + per-user read cursors (additive).

CREATE TABLE IF NOT EXISTS store_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  actor_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,
  resource_type TEXT,
  resource_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_notifications_store_unread
  ON store_notifications(store_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_notifications_resource
  ON store_notifications(resource_type, resource_id);

CREATE TABLE IF NOT EXISTS store_read_cursors (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'messages',
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, store_id, channel)
);

ALTER TABLE store_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_read_cursors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_notifications_staff ON store_notifications;
CREATE POLICY store_notifications_staff ON store_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'store_staff')
    )
  );

DROP POLICY IF EXISTS store_read_cursors_staff ON store_read_cursors;
CREATE POLICY store_read_cursors_staff ON store_read_cursors FOR ALL
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

COMMENT ON TABLE store_notifications IS '門市協作：跨店需求／回覆／留言等未讀提醒';
COMMENT ON TABLE store_read_cursors IS '門市人員各頻道最後已讀時間（留言等）';
