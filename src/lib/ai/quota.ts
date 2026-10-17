/**
 * 會員 AI 額度：原子扣除 + 冪等。
 *
 * 身分與額度都由資料庫的 RPC 自己認（auth.uid()、ai_settings），
 * 伺服器不傳 user_id，也不傳上限，避免 SECURITY DEFINER 函式被當成後門。
 *
 * 對應 migration：20261017090000_ai_atomic_quota.sql
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { nextResetAt } from "./usage";
import type { AIToolId } from "./types";

export type QuotaSnapshot = {
  used: number;
  remaining: number;
  limit: number;
  resetAt: string;
};

export type ReserveResult =
  | { ok: true; requestId: string | null; reused: boolean; snap: QuotaSnapshot }
  | {
      ok: false;
      reason: "NOT_AUTHENTICATED" | "QUOTA_EXCEEDED" | "MAINTENANCE" | "UNAVAILABLE";
      snap: QuotaSnapshot | null;
    };

type RpcResult = {
  ok?: boolean;
  reason?: string;
  reused?: boolean;
  request_id?: string | null;
  used?: number;
  remaining?: number;
  limit?: number;
};

function snapOf(r: RpcResult): QuotaSnapshot {
  return {
    used: Number(r.used ?? 0),
    remaining: Number(r.remaining ?? 0),
    limit: Number(r.limit ?? 0),
    resetAt: nextResetAt(),
  };
}

/**
 * 這個欄位讓新機制可以整段關掉：migration 還沒跑、或線上出狀況要退回舊行為時，
 * 設 AI_ATOMIC_QUOTA=off 即可，不用改程式也不用 rollback 資料庫。
 */
export function atomicQuotaEnabled(): boolean {
  return process.env.AI_ATOMIC_QUOTA?.trim().toLowerCase() !== "off";
}

/**
 * 保留一次額度。同一個 requestKey 重送不會重複扣。
 * 回 NOT_AUTHENTICATED 代表沒登入（AI 功能限會員）。
 */
export async function reserveAiRequest(options: {
  requestKey: string;
  tool?: AIToolId | null;
  conversationId?: string | null;
}): Promise<ReserveResult> {
  if (!isSupabaseConfigured() || !atomicQuotaEnabled()) {
    return { ok: false, reason: "UNAVAILABLE", snap: null };
  }

  // 用「會員自己的 session」呼叫，RPC 裡的 auth.uid() 才認得出是誰。
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_ai_request", {
    p_request_key: options.requestKey,
    p_tool: options.tool ?? null,
    p_conversation_id: options.conversationId ?? null,
  });

  if (error) {
    // migration 還沒跑（找不到函式）時，交給呼叫端退回舊的計數方式。
    return { ok: false, reason: "UNAVAILABLE", snap: null };
  }

  const r = (data ?? {}) as RpcResult;
  if (r.ok) {
    return {
      ok: true,
      requestId: r.request_id ?? null,
      reused: r.reused === true,
      snap: snapOf(r),
    };
  }

  if (r.reason === "not_authenticated") {
    return { ok: false, reason: "NOT_AUTHENTICATED", snap: null };
  }
  if (r.reason === "quota_exceeded") {
    return { ok: false, reason: "QUOTA_EXCEEDED", snap: snapOf(r) };
  }
  if (r.reason === "disabled") {
    return { ok: false, reason: "MAINTENANCE", snap: null };
  }
  return { ok: false, reason: "UNAVAILABLE", snap: null };
}

/**
 * 結案。`refund` 只有在「確定還沒送出給模型」時才給 true；
 * 不確定是否已呼叫模型就不要退，寧可少退也不要造成雙重支出。
 */
export async function completeAiRequest(options: {
  requestKey: string;
  status: "processing" | "completed" | "failed";
  errorCode?: string | null;
  refund?: boolean;
}): Promise<void> {
  if (!isSupabaseConfigured() || !atomicQuotaEnabled()) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("complete_ai_request", {
      p_request_key: options.requestKey,
      p_status: options.status,
      p_error_code: options.errorCode ?? null,
      p_refund: options.refund === true,
    });
  } catch {
    // 結案失敗不該讓整個回應失敗；逾時回收那支排程會再處理。
  }
}

/** 給 /api/ai/usage 用：查自己今天用了幾次。 */
export async function getQuotaSnapshot(): Promise<QuotaSnapshot | null> {
  if (!isSupabaseConfigured() || !atomicQuotaEnabled()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("ai_quota_snapshot");
    if (error) return null;
    const r = (data ?? {}) as RpcResult;
    if (!r.ok) return null;
    return snapOf(r);
  } catch {
    return null;
  }
}
