-- Member gift phase 7: multi-item selection mode on campaigns

ALTER TABLE gift_campaigns
  ADD COLUMN IF NOT EXISTS item_selection_mode TEXT NOT NULL DEFAULT 'single';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gift_campaigns_item_selection_mode_check'
  ) THEN
    ALTER TABLE gift_campaigns
      ADD CONSTRAINT gift_campaigns_item_selection_mode_check
      CHECK (item_selection_mode IN ('single', 'member_pick', 'random', 'staff_pick'));
  END IF;
END $$;

COMMENT ON COLUMN gift_campaigns.item_selection_mode IS
  'single=單一品項; member_pick=會員任選; random=系統隨機; staff_pick=門市核銷時選擇';
