-- Store Ops Phase C: dedicated tables for branch requests, messages, daily todos, work logs.
-- Product master remains `products` (single source of truth). Safe to re-run.

-- ---------------------------------------------------------------------------
-- store_requests — 分店叫貨／補貨需求
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_label TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_name TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_requests_store_status
  ON store_requests(store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_requests_product
  ON store_requests(product_id) WHERE product_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- store_messages — 店內留言（類 LINE）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_messages_store_created
  ON store_messages(store_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- store_work_logs — 每日工作紀錄
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_work_logs_store_date
  ON store_work_logs(store_id, log_date DESC, created_at DESC);

-- ---------------------------------------------------------------------------
-- store_todos — 每日待辦（可自動建立樣板）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  todo_date DATE NOT NULL,
  label TEXT NOT NULL,
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  done_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'template'
    CHECK (source IN ('template', 'manual', 'system')),
  template_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_todos_template_unique
  ON store_todos(store_id, todo_date, template_key)
  WHERE template_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_store_todos_store_date
  ON store_todos(store_id, todo_date, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION store_ops_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON store_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON store_requests
  FOR EACH ROW EXECUTE FUNCTION store_ops_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON store_todos;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON store_todos
  FOR EACH ROW EXECUTE FUNCTION store_ops_set_updated_at();

-- ---------------------------------------------------------------------------
-- Ensure daily template todos for a store (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_store_daily_todos(p_store_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('order'::text, '點貨'::text, '/admin/store/batches?receive=1'::text, 10),
      ('fridge', '清冰箱', '/admin/store/expiry', 20),
      ('cream', '補奶油', '/admin/store/inventory', 30),
      ('returns', '清退貨', '/admin/store/returns', 40),
      ('labels', '更新價格牌', '/admin/products/labels', 50)
    ) AS t(template_key, label, href, sort_order)
  LOOP
    INSERT INTO store_todos (store_id, todo_date, label, href, sort_order, source, template_key)
    SELECT p_store_id, p_date, r.label, r.href, r.sort_order, 'template', r.template_key
    WHERE NOT EXISTS (
      SELECT 1 FROM store_todos x
      WHERE x.store_id = p_store_id
        AND x.todo_date = p_date
        AND x.template_key = r.template_key
    );
    IF FOUND THEN
      inserted := inserted + 1;
    END IF;
  END LOOP;
  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION ensure_store_daily_todos(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_store_daily_todos(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION ensure_store_daily_todos(UUID, DATE) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE store_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_requests_staff ON store_requests;
CREATE POLICY store_requests_staff ON store_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  );

DROP POLICY IF EXISTS store_messages_staff ON store_messages;
CREATE POLICY store_messages_staff ON store_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  );

DROP POLICY IF EXISTS store_work_logs_staff ON store_work_logs;
CREATE POLICY store_work_logs_staff ON store_work_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  );

DROP POLICY IF EXISTS store_todos_staff ON store_todos;
CREATE POLICY store_todos_staff ON store_todos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')
    )
  );

COMMENT ON TABLE store_requests IS '門市分店叫貨／補貨需求（Phase C）';
COMMENT ON TABLE store_messages IS '門市店內留言（Phase C）';
COMMENT ON TABLE store_work_logs IS '門市每日工作紀錄（Phase C）';
COMMENT ON TABLE store_todos IS '門市每日待辦（Phase C）';
