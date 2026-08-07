-- Member gift phase 13: member_points for points_threshold eligibility

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS member_points INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.member_points IS
  'App 會員點數（非 POS）；用於會員禮 points_threshold 資格判斷';
