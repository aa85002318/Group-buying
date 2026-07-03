-- 增量同步：將舊版資料庫補齊至 complete-schema.sql 最新狀態
-- 適用於已執行 20250629000000 或 20250630000000 的專案
-- 可安全重複執行（IF NOT EXISTS / IF EXISTS）

-- profiles：儲值金餘額
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0;

-- orders：取貨門市
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_store_id UUID REFERENCES stores(id);

-- payment_reports：備註
ALTER TABLE payment_reports ADD COLUMN IF NOT EXISTS notes TEXT;

-- pickup_records：核銷人員
ALTER TABLE pickup_records ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

-- push / user notifications：連結
ALTER TABLE push_notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- support_tickets：優先級（若舊表無此欄）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'priority'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN priority support_ticket_priority NOT NULL DEFAULT 'medium';
  END IF;
END $$;

-- commission_payouts：批次發放狀態欄位
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS status commission_payout_status NOT NULL DEFAULT 'pending';
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES profiles(id);
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- share_clicks：工作階段追蹤
ALTER TABLE share_clicks ADD COLUMN IF NOT EXISTS session_id TEXT;

-- referrals：推薦碼
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- coupons：有效期間
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- audit_logs：額外詳情
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- reward_records：審核欄位（舊版可能已有 approved_by，僅在缺少時補齊）
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES profiles(id);
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ;
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS description TEXT;

-- 訂單狀態 ENUM 補齊（payment_reported / payment_confirmed 取代舊版 paid）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'payment_reported') THEN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_reported';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'payment_confirmed') THEN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_confirmed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'awaiting_payment') THEN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
  END IF;
END $$;
