-- Rollback：20261017090000_ai_atomic_quota.sql
--
-- 安全性：只移除這次新增的東西。ai_usage_logs、ai_conversations、ai_messages、
-- ai_settings 都不是這次建立的，完全不動。
--
-- 注意：DROP TABLE 會連同已累積的當日用量與請求紀錄一起刪除。
-- 如果只是想暫時停用新機制，不要跑這份；把程式的 AI_ATOMIC_QUOTA 開關關掉即可
-- （程式會自動退回舊的 ai_usage_logs 計數）。

DROP FUNCTION IF EXISTS public.ai_quota_snapshot();
DROP FUNCTION IF EXISTS public.complete_ai_request(UUID, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.reserve_ai_request(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.ai_daily_limit_for(UUID);
DROP FUNCTION IF EXISTS public.ai_taipei_today();

DROP TABLE IF EXISTS public.ai_requests;
DROP TABLE IF EXISTS public.ai_daily_usage;
