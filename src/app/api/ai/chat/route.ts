import { aiError, aiOk } from "@/lib/ai/response";
import { runAITool } from "@/lib/ai/engine";
import { resolveAIIdentity } from "@/lib/ai/identity";
import { assertUsageAvailable, consumeUsage } from "@/lib/ai/usage";
import { completeAiRequest, reserveAiRequest } from "@/lib/ai/quota";
import { randomUUID } from "crypto";
import { getAISettings } from "@/lib/ai/settings";
import { findSensitiveHit } from "@/lib/ai/moderation";
import { logAIError, trackAnalyticsEvent } from "@/lib/ai/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import type { AIToolId } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOOLS: AIToolId[] = ["recipes", "scale", "oven", "substitute", "failure", "chat"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const started = Date.now();
  const identity = await resolveAIIdentity(request);
  const settings = await getAISettings();
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return aiError("VALIDATION", "請提供有效的 JSON", { status: 400 });
  }

  const tool = (typeof body.tool === "string" ? body.tool : "chat") as AIToolId;
  if (!TOOLS.includes(tool)) {
    return aiError("VALIDATION", "未知的 AI 功能", { status: 400 });
  }

  const text = String(body.text ?? body.symptom ?? body.ingredient ?? "");
  if (text.length > settings.maxInputChars) {
    return aiError("VALIDATION", "內容過長，請精簡後再送出。", { status: 400 });
  }

  const sensitive = findSensitiveHit(text, settings.sensitiveRules);
  if (sensitive) {
    return aiError("VALIDATION", sensitive, { status: 400 });
  }

  // AI 功能限會員使用。
  if (!identity.userId) {
    return aiError("UNAUTHORIZED", "請先登入會員才能使用 AI 助手。", { status: 401 });
  }

  // 冪等鍵：前端重送同一個 key 不會重複扣次。
  // 注意：這裡保證的是「額度只扣一次」，模型還是會再跑一次——上一次的回覆沒有留存
  //（規格要求不儲存聊天全文），重送時只能重新產生。要連模型呼叫都省掉，就得把回覆
  // 內容也寫進 ai_requests，那會牴觸不留存全文的要求，所以這裡選擇只保護額度。
  const requestKey =
    typeof body.requestKey === "string" && UUID_RE.test(body.requestKey)
      ? body.requestKey
      : randomUUID();

  // 原子保留額度（檢查 + 扣除在同一個資料庫交易內完成）。
  const reserved = await reserveAiRequest({
    requestKey,
    tool,
    conversationId: typeof body.conversationId === "string" ? body.conversationId : null,
  });

  if (!reserved.ok && reserved.reason === "NOT_AUTHENTICATED") {
    return aiError("UNAUTHORIZED", "請先登入會員才能使用 AI 助手。", { status: 401 });
  }
  if (!reserved.ok && reserved.reason === "QUOTA_EXCEEDED") {
    return aiError("QUOTA_EXCEEDED", "今天的AI使用次數已用完，明天可以繼續使用。", {
      status: 429,
      usage: reserved.snap
        ? { used: reserved.snap.used, remaining: 0, resetAt: reserved.snap.resetAt }
        : undefined,
    });
  }
  if (!reserved.ok && reserved.reason === "MAINTENANCE") {
    return aiError("MAINTENANCE", "AI 助手維護中，請稍後再試。", { status: 503 });
  }

  // reserved.ok === false 且 reason === "UNAVAILABLE"：migration 還沒跑，
  // 或新機制被 AI_ATOMIC_QUOTA=off 關掉 → 退回舊的計數方式，功能不中斷。
  const usingAtomic = reserved.ok;

  const available = await assertUsageAvailable(identity, tool);
  if (!usingAtomic && !available.ok) {
    if (available.reason === "QUOTA_EXCEEDED") {
      return aiError("QUOTA_EXCEEDED", "今天的AI使用次數已用完，明天可以繼續使用。", {
        status: 429,
        usage: {
          used: available.snap.used,
          remaining: 0,
          resetAt: available.snap.resetAt,
        },
      });
    }
    return aiError("MAINTENANCE", "AI 助手維護中，請稍後再試。", { status: 503 });
  }

  try {
    const data = await Promise.race([
      runAITool(tool, body),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("TIMEOUT")), 20_000);
      }),
    ]);

    const durationMs = Date.now() - started;

    let usage;
    if (usingAtomic && reserved.ok) {
      // 額度在保留時就扣掉了，這裡只結案；明細日誌照舊寫，不影響既有統計。
      await completeAiRequest({ requestKey, status: "completed" });
      void consumeUsage(identity, tool, {
        retryOf: body.retryOf ?? null,
        durationMs,
        success: true,
        counted: false,
        requestKey,
      });
      usage = {
        used: reserved.snap.used,
        remaining: reserved.snap.remaining,
        resetAt: reserved.snap.resetAt,
      };
    } else {
      const consumed = await consumeUsage(identity, tool, {
        retryOf: body.retryOf ?? null,
        durationMs,
        success: true,
      });
      usage = consumed.ok
        ? {
            used: consumed.snap.used,
            remaining: consumed.snap.remaining,
            resetAt: consumed.snap.resetAt,
          }
        : {
            used: available.snap.used,
            remaining: available.snap.remaining,
            resetAt: available.snap.resetAt,
          };
    }

    const askLabel =
      tool === "recipes"
        ? String((body.ingredients as string[] | undefined)?.join("、") ?? text)
        : tool === "failure"
          ? String(body.symptom ?? text)
          : tool;
    void trackAnalyticsEvent({ eventType: "ask", tool, label: askLabel });

    const save = body.save !== false && settings.saveConversationsDefault !== false;
    if (identity.userId && isSupabaseConfigured() && save) {
      try {
        const admin = createAdminClient();
        let conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
        if (conversationId) {
          const { data: owned } = await admin
            .from("ai_conversations")
            .select("id")
            .eq("id", conversationId)
            .eq("user_id", identity.userId)
            .maybeSingle();
          if (!owned) conversationId = null;
        }
        if (!conversationId) {
          const title =
            text.slice(0, 24) ||
            (tool === "recipes" ? "材料推薦" : tool === "scale" ? "份量換算" : "AI 對話");
          const { data: conv } = await admin
            .from("ai_conversations")
            .insert({ user_id: identity.userId, title, tool })
            .select("id")
            .single();
          conversationId = conv?.id ?? null;
        }
        if (conversationId) {
          await admin.from("ai_messages").insert([
            {
              conversation_id: conversationId,
              role: "user",
              content: text || JSON.stringify(body),
              payload: body,
            },
            {
              conversation_id: conversationId,
              role: "assistant",
              content: JSON.stringify(data),
              payload: data,
            },
          ]);
          await admin
            .from("ai_conversations")
            .update({ updated_at: new Date().toISOString(), tool })
            .eq("id", conversationId)
            .eq("user_id", identity.userId);
        }
        return aiOk({ ...(data as object), conversationId }, usage);
      } catch {
        return aiOk(data, usage);
      }
    }

    return aiOk(data, usage);
  } catch (e) {
    const timeout = e instanceof Error && e.message === "TIMEOUT";
    const code = timeout ? "TIMEOUT" : "AI_UNAVAILABLE";
    const message = timeout
      ? "目前AI回覆時間較長，請稍後再試。"
      : "目前無法取得 AI 回覆，請稍後重試或改用關鍵字搜尋食譜。";

    if (usingAtomic) {
      // 逾時代表模型可能已經在跑了，不退額度（避免重試造成雙重支出）；
      // 其他錯誤是在呼叫模型前後明確失敗，退還這一次。
      await completeAiRequest({
        requestKey,
        status: "failed",
        errorCode: code,
        refund: !timeout,
      });
    }

    void logAIError({
      tool,
      code,
      message,
      userId: identity.userId,
    });
    void trackAnalyticsEvent({ eventType: "failure", tool, label: code });
    return aiError(code, message, {
      status: timeout ? 504 : 502,
      retryable: true,
      usage:
        usingAtomic && reserved.ok
          ? {
              used: timeout ? reserved.snap.used : Math.max(0, reserved.snap.used - 1),
              remaining: timeout ? reserved.snap.remaining : reserved.snap.remaining + 1,
              resetAt: reserved.snap.resetAt,
            }
          : {
              used: available.snap.used,
              remaining: available.snap.remaining,
              resetAt: available.snap.resetAt,
            },
    });
  }
}
