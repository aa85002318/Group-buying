-- 麵包小怪獸：購後分享小遊戲
-- 可安全重複執行（IF NOT EXISTS）

-- ENUM 型別
DO $$ BEGIN
  CREATE TYPE monster_share_status AS ENUM ('pending_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE monster_reward_status AS ENUM ('pending_review', 'issued', 'used', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 小怪獸檔案（每位會員一隻）
CREATE TABLE IF NOT EXISTS monster_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  monster_name TEXT NOT NULL DEFAULT '麵包小怪獸',
  bread_kg DECIMAL(8,2) NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_stage TEXT NOT NULL DEFAULT 'hungry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monster_profiles_user ON monster_profiles(user_id);

DROP TRIGGER IF EXISTS monster_profiles_updated_at ON monster_profiles;
CREATE TRIGGER monster_profiles_updated_at BEFORE UPDATE ON monster_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 遊戲獎勵門檻規則
CREATE TABLE IF NOT EXISTS reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threshold_kg DECIMAL(8,2) NOT NULL,
  reward_type TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_rules_threshold ON reward_rules(threshold_kg);

DROP TRIGGER IF EXISTS reward_rules_updated_at ON reward_rules;
CREATE TRIGGER reward_rules_updated_at BEFORE UPDATE ON reward_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 遊戲設定（單列）
CREATE TABLE IF NOT EXISTS monster_game_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_kg DECIMAL(8,2) NOT NULL DEFAULT 0.5,
  min_chars INTEGER NOT NULL DEFAULT 10,
  bonus_chars INTEGER NOT NULL DEFAULT 30,
  bonus_kg DECIMAL(8,2) NOT NULL DEFAULT 0.5,
  photo_kg DECIMAL(8,2) NOT NULL DEFAULT 1,
  daily_limit INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS monster_game_settings_updated_at ON monster_game_settings;
CREATE TRIGGER monster_game_settings_updated_at BEFORE UPDATE ON monster_game_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 商品分享紀錄
CREATE TABLE IF NOT EXISTS product_share_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  has_photo BOOLEAN NOT NULL DEFAULT false,
  line_share_text TEXT,
  share_url TEXT,
  bread_kg_awarded DECIMAL(8,2) NOT NULL DEFAULT 0,
  status monster_share_status NOT NULL DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_share_records_user ON product_share_records(user_id);
CREATE INDEX IF NOT EXISTS idx_product_share_records_status ON product_share_records(status);
CREATE INDEX IF NOT EXISTS idx_product_share_records_created ON product_share_records(created_at);

DROP TRIGGER IF EXISTS product_share_records_updated_at ON product_share_records;
CREATE TRIGGER product_share_records_updated_at BEFORE UPDATE ON product_share_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 餵食紀錄
CREATE TABLE IF NOT EXISTS monster_feed_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  share_record_id UUID REFERENCES product_share_records(id),
  bread_kg DECIMAL(8,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monster_feed_logs_user ON monster_feed_logs(user_id);

-- 小怪獸獎勵
CREATE TABLE IF NOT EXISTS monster_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_rule_id UUID NOT NULL REFERENCES reward_rules(id),
  threshold_kg DECIMAL(8,2) NOT NULL,
  reward_type TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value TEXT,
  status monster_reward_status NOT NULL DEFAULT 'pending_review',
  issued_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monster_rewards_user ON monster_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_monster_rewards_status ON monster_rewards(status);

DROP TRIGGER IF EXISTS monster_rewards_updated_at ON monster_rewards;
CREATE TRIGGER monster_rewards_updated_at BEFORE UPDATE ON monster_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- LINE 分享事件
CREATE TABLE IF NOT EXISTS line_share_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  share_record_id UUID REFERENCES product_share_records(id),
  event_type TEXT NOT NULL,
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_share_events_user ON line_share_events(user_id);

-- 預設遊戲設定
INSERT INTO monster_game_settings (id, share_kg, min_chars, bonus_chars, bonus_kg, photo_kg, daily_limit)
SELECT uuid_generate_v4(), 0.5, 10, 30, 0.5, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM monster_game_settings LIMIT 1);

-- 預設獎勵門檻
INSERT INTO reward_rules (id, threshold_kg, reward_type, reward_name, reward_value, is_active)
VALUES
  ('a7000001-0000-4000-8000-000000000001', 5,  'store_credit',  '儲值金 20 元', '20', true),
  ('a7000001-0000-4000-8000-000000000002', 10, 'coupon',        '折價券 50 元', '50', true),
  ('a7000001-0000-4000-8000-000000000003', 20, 'free_shipping', '免運券',       NULL, true),
  ('a7000001-0000-4000-8000-000000000004', 30, 'mystery_gift',  '神秘禮物',     NULL, true)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE monster_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_share_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_share_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monster_profiles_own ON monster_profiles;
CREATE POLICY monster_profiles_own ON monster_profiles FOR ALL
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS reward_rules_read ON reward_rules;
CREATE POLICY reward_rules_read ON reward_rules FOR SELECT
  USING (true);
DROP POLICY IF EXISTS reward_rules_admin ON reward_rules;
CREATE POLICY reward_rules_admin ON reward_rules FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS monster_game_settings_read ON monster_game_settings;
CREATE POLICY monster_game_settings_read ON monster_game_settings FOR SELECT
  USING (true);
DROP POLICY IF EXISTS monster_game_settings_admin ON monster_game_settings;
CREATE POLICY monster_game_settings_admin ON monster_game_settings FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS product_share_records_own ON product_share_records;
CREATE POLICY product_share_records_own ON product_share_records FOR ALL
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS monster_feed_logs_own ON monster_feed_logs;
CREATE POLICY monster_feed_logs_own ON monster_feed_logs FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS monster_feed_logs_insert ON monster_feed_logs;
CREATE POLICY monster_feed_logs_insert ON monster_feed_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS monster_rewards_own ON monster_rewards;
CREATE POLICY monster_rewards_own ON monster_rewards FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS monster_rewards_admin ON monster_rewards;
CREATE POLICY monster_rewards_admin ON monster_rewards FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS line_share_events_own ON line_share_events;
CREATE POLICY line_share_events_own ON line_share_events FOR ALL
  USING (user_id = auth.uid() OR is_admin());
