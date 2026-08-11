-- Formal AI assistant: usage, conversations, settings (no embeddings required for phase 1)

CREATE TABLE IF NOT EXISTS ai_settings (
  settings_key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_settings (settings_key, config)
VALUES ('default', '{
  "enabled": true,
  "maintenance": false,
  "guestDailyLimit": 3,
  "memberDailyLimit": 20,
  "adminDailyLimit": 100,
  "maxInputChars": 2000,
  "conversationRetentionDays": 30,
  "systemPromptVersion": "v1"
}'::jsonb)
ON CONFLICT (settings_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  tool TEXT,
  save_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
  ON ai_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv
  ON ai_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_key TEXT,
  tool TEXT NOT NULL,
  counted BOOLEAN NOT NULL DEFAULT TRUE,
  usage_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Taipei')::date),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_day
  ON ai_usage_logs(user_id, usage_date)
  WHERE counted = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_usage_guest_day
  ON ai_usage_logs(guest_key, usage_date)
  WHERE counted = TRUE AND guest_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  rating SMALLINT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tool TEXT,
  code TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_products (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, product_id)
);

CREATE TABLE IF NOT EXISTS recipe_embeddings (
  recipe_id UUID PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  embedding TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_settings_admin ON ai_settings;
CREATE POLICY ai_settings_admin ON ai_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS ai_conversations_own ON ai_conversations;
CREATE POLICY ai_conversations_own ON ai_conversations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ai_messages_own ON ai_messages;
CREATE POLICY ai_messages_own ON ai_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS ai_usage_own ON ai_usage_logs;
CREATE POLICY ai_usage_own ON ai_usage_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_usage_admin ON ai_usage_logs;
CREATE POLICY ai_usage_admin ON ai_usage_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS ai_feedback_own ON ai_feedback;
CREATE POLICY ai_feedback_own ON ai_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS recipe_tags_read ON recipe_tags;
CREATE POLICY recipe_tags_read ON recipe_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS recipe_products_read ON recipe_products;
CREATE POLICY recipe_products_read ON recipe_products FOR SELECT USING (true);

DROP POLICY IF EXISTS recipe_embeddings_admin ON recipe_embeddings;
CREATE POLICY recipe_embeddings_admin ON recipe_embeddings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')));

COMMENT ON TABLE ai_usage_logs IS 'Server-side AI quota; admin stats should avoid joining identifiable content';
