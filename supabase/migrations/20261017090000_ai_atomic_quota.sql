-- 會員 AI 額度：原子扣除 + 冪等
--
-- 問題：原本的扣額是「先 SELECT count(*) 檢查 ai_usage_logs，再 INSERT 一列」，
-- 兩個動作分開，同時開兩個分頁或連點就會超額；而且沒有 request_key，
-- 重新整理或網路重試會重複扣次、重複呼叫模型。
--
-- 做法：新增一張 counter 表（ai_daily_usage）與一張請求表（ai_requests），
-- 由 SECURITY DEFINER RPC 在同一個交易內完成「檢查 + 扣除 + 記錄」。
-- ai_usage_logs 保留不動（仍是明細日誌），現有查詢不受影響。
--
-- 每日上限讀 ai_settings.config，後台可調；不接受呼叫端傳入上限。
-- 日期用 Asia/Taipei，午夜重置。

-- ---------------------------------------------------------------------------
-- 1. 每日用量 counter
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_daily_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date),
  CONSTRAINT ai_daily_usage_count_non_negative CHECK (used_count >= 0)
);

-- ---------------------------------------------------------------------------
-- 2. 請求表（冪等 + 對帳）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_key UUID NOT NULL,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  tool TEXT,
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'processing', 'completed', 'failed', 'refunded')),
  error_code TEXT,
  usage_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT ai_requests_user_key_unique UNIQUE (user_id, request_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user_created
  ON public.ai_requests (user_id, created_at DESC);
-- 逾時回收用：撈還卡在 reserved / processing 的請求
CREATE INDEX IF NOT EXISTS idx_ai_requests_open
  ON public.ai_requests (status, created_at)
  WHERE status IN ('reserved', 'processing');

-- ---------------------------------------------------------------------------
-- 3. RLS：會員只能讀自己的，不能自己寫
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_daily_usage_select_own ON public.ai_daily_usage;
CREATE POLICY ai_daily_usage_select_own ON public.ai_daily_usage
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_requests_select_own ON public.ai_requests;
CREATE POLICY ai_requests_select_own ON public.ai_requests
  FOR SELECT USING (user_id = auth.uid());

-- 故意不給 INSERT / UPDATE / DELETE policy：
-- 一般會員只能透過下面的 RPC 動這兩張表，service_role 不受 RLS 限制。
REVOKE ALL ON public.ai_daily_usage FROM anon, authenticated;
REVOKE ALL ON public.ai_requests FROM anon, authenticated;
GRANT SELECT ON public.ai_daily_usage TO authenticated;
GRANT SELECT ON public.ai_requests TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. 台北日期
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ai_taipei_today()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT ((NOW() AT TIME ZONE 'Asia/Taipei')::date);
$$;

-- ---------------------------------------------------------------------------
-- 5. 每日上限（後台 ai_settings 可調；找不到設定時給保守預設）
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ai_daily_limit_for(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_config JSONB;
  v_role TEXT;
  v_limit INTEGER;
BEGIN
  SELECT config INTO v_config FROM public.ai_settings WHERE settings_key = 'default';
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  IF v_role = 'admin' THEN
    v_limit := COALESCE((v_config ->> 'adminDailyLimit')::INTEGER, 100);
  ELSE
    v_limit := COALESCE((v_config ->> 'memberDailyLimit')::INTEGER, 20);
  END IF;

  -- 上限本身也要有上下界，避免設定被改成荒謬的值。
  RETURN GREATEST(0, LEAST(v_limit, 1000));
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. 保留一次額度（原子 + 冪等）
--
-- 回傳 JSONB：
--   { ok, reason, request_id, used, remaining, limit, usage_date, reused }
--
-- reason: 'ok' | 'quota_exceeded' | 'not_authenticated' | 'disabled'
-- reused = true 代表同一個 request_key 之前已經保留過，這次不再扣額。
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_ai_request(
  p_request_key UUID,
  p_tool TEXT DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := public.ai_taipei_today();
  v_limit INTEGER;
  v_used INTEGER;
  v_request public.ai_requests%ROWTYPE;
  v_config JSONB;
BEGIN
  -- 身分一律由資料庫自己認，不接受呼叫端指定 user_id。
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  IF p_request_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_request_key');
  END IF;

  SELECT config INTO v_config FROM public.ai_settings WHERE settings_key = 'default';
  IF COALESCE((v_config ->> 'enabled')::BOOLEAN, true) = false
     OR COALESCE((v_config ->> 'maintenance')::BOOLEAN, false) = true THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'disabled');
  END IF;

  v_limit := public.ai_daily_limit_for(v_user);

  -- 冪等：同一個 request_key 已經存在就直接回上次的結果，不重複扣額。
  SELECT * INTO v_request
  FROM public.ai_requests
  WHERE user_id = v_user AND request_key = p_request_key;

  IF FOUND THEN
    SELECT COALESCE(used_count, 0) INTO v_used
    FROM public.ai_daily_usage
    WHERE user_id = v_user AND usage_date = v_request.usage_date;

    RETURN jsonb_build_object(
      'ok', v_request.status <> 'failed',
      'reason', 'ok',
      'reused', true,
      'request_id', v_request.id,
      'status', v_request.status,
      'used', COALESCE(v_used, 0),
      'remaining', GREATEST(0, v_limit - COALESCE(v_used, 0)),
      'limit', v_limit,
      'usage_date', v_request.usage_date
    );
  END IF;

  -- 原子扣除：只有在還沒額滿時才會真的 +1。
  -- 同時進來的請求會在同一列上排隊（ON CONFLICT 會鎖住該列）。
  INSERT INTO public.ai_daily_usage (user_id, usage_date, used_count, updated_at)
  VALUES (v_user, v_today, 1, NOW())
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET used_count = public.ai_daily_usage.used_count + 1,
        updated_at = NOW()
    WHERE public.ai_daily_usage.used_count < v_limit
  RETURNING used_count INTO v_used;

  IF v_used IS NULL THEN
    -- WHERE 沒過 = 已經額滿。
    SELECT used_count INTO v_used
    FROM public.ai_daily_usage
    WHERE user_id = v_user AND usage_date = v_today;

    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'quota_exceeded',
      'used', COALESCE(v_used, v_limit),
      'remaining', 0,
      'limit', v_limit,
      'usage_date', v_today
    );
  END IF;

  INSERT INTO public.ai_requests (user_id, request_key, conversation_id, tool, status, usage_date)
  VALUES (v_user, p_request_key, p_conversation_id, p_tool, 'reserved', v_today)
  RETURNING * INTO v_request;

  RETURN jsonb_build_object(
    'ok', true,
    'reason', 'ok',
    'reused', false,
    'request_id', v_request.id,
    'status', v_request.status,
    'used', v_used,
    'remaining', GREATEST(0, v_limit - v_used),
    'limit', v_limit,
    'usage_date', v_today
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. 結案：完成 / 失敗（失敗時可選擇退還額度）
--
-- 只有「確定還沒送出給模型」的失敗才退額；不確定是否已呼叫模型時傳
-- p_refund = false，寧可不退也不要造成雙重支出。
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_ai_request(
  p_request_key UUID,
  p_status TEXT,
  p_error_code TEXT DEFAULT NULL,
  p_refund BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_request public.ai_requests%ROWTYPE;
  v_used INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  IF p_status NOT IN ('processing', 'completed', 'failed', 'refunded') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_status');
  END IF;

  SELECT * INTO v_request
  FROM public.ai_requests
  WHERE user_id = v_user AND request_key = p_request_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  -- 已經結過案就不再動額度（重送不會重複退款）。
  IF v_request.status IN ('completed', 'refunded') THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_settled', 'status', v_request.status);
  END IF;

  IF p_refund AND p_status IN ('failed', 'refunded') THEN
    UPDATE public.ai_daily_usage
    SET used_count = GREATEST(0, used_count - 1),
        updated_at = NOW()
    WHERE user_id = v_user AND usage_date = v_request.usage_date
    RETURNING used_count INTO v_used;

    UPDATE public.ai_requests
    SET status = 'refunded', error_code = p_error_code, completed_at = NOW()
    WHERE id = v_request.id;

    RETURN jsonb_build_object('ok', true, 'reason', 'refunded', 'used', COALESCE(v_used, 0));
  END IF;

  UPDATE public.ai_requests
  SET status = p_status,
      error_code = p_error_code,
      completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END
  WHERE id = v_request.id;

  RETURN jsonb_build_object('ok', true, 'reason', 'ok', 'status', p_status);
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. 查自己今天的額度（給 /api/ai/usage 用）
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ai_quota_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := public.ai_taipei_today();
  v_limit INTEGER;
  v_used INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  v_limit := public.ai_daily_limit_for(v_user);
  SELECT COALESCE(used_count, 0) INTO v_used
  FROM public.ai_daily_usage
  WHERE user_id = v_user AND usage_date = v_today;

  RETURN jsonb_build_object(
    'ok', true,
    'used', COALESCE(v_used, 0),
    'remaining', GREATEST(0, v_limit - COALESCE(v_used, 0)),
    'limit', v_limit,
    'usage_date', v_today
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. 權限：只開放登入會員呼叫，拿掉 PUBLIC 的預設執行權
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.reserve_ai_request(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_ai_request(UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ai_quota_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ai_daily_limit_for(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reserve_ai_request(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ai_request(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_quota_snapshot() TO authenticated;
-- ai_daily_limit_for 只給內部函式與 service_role 用。
GRANT EXECUTE ON FUNCTION public.ai_daily_limit_for(UUID) TO service_role;
