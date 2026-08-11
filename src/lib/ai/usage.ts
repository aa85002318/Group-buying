import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { getAISettings } from "./settings";
import type { AISettings, AIToolId } from "./types";

export type UsageIdentity = {
  userId: string | null;
  role: string | null;
  guestKey: string;
};

function taipeiDayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function nextResetAt() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  // Next Taipei midnight as UTC+8
  return new Date(Date.UTC(y, m - 1, day + 1, -8, 0, 0)).toISOString();
}

function dailyLimit(settings: AISettings, role: string | null) {
  if (role === "admin") return settings.adminDailyLimit;
  if (role) return settings.memberDailyLimit;
  return settings.guestDailyLimit;
}

export async function getUsageSnapshot(identity: UsageIdentity, tool?: AIToolId) {
  const settings = await getAISettings();
  const limit = dailyLimit(settings, identity.role);
  if (!isSupabaseConfigured()) {
    return {
      used: 0,
      remaining: limit,
      resetAt: nextResetAt(),
      limit,
      settings,
      toolUsed: 0,
      toolLimit: tool ? settings.toolLimits[tool] ?? limit : limit,
    };
  }

  const admin = createAdminClient();
  const day = taipeiDayKey();
  let query = admin
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("usage_date", day)
    .eq("counted", true);
  query = identity.userId
    ? query.eq("user_id", identity.userId)
    : query.eq("guest_key", identity.guestKey);
  const { count } = await query;
  const used = count ?? 0;

  let toolUsed = 0;
  const toolLimit = tool ? settings.toolLimits[tool] ?? limit : limit;
  if (tool) {
    let tq = admin
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("usage_date", day)
      .eq("counted", true)
      .eq("tool", tool);
    tq = identity.userId ? tq.eq("user_id", identity.userId) : tq.eq("guest_key", identity.guestKey);
    const { count: tc } = await tq;
    toolUsed = tc ?? 0;
  }

  return {
    used,
    remaining: Math.max(0, limit - used),
    resetAt: nextResetAt(),
    limit,
    settings,
    toolUsed,
    toolLimit,
  };
}

export async function assertUsageAvailable(identity: UsageIdentity, tool?: AIToolId) {
  const snap = await getUsageSnapshot(identity, tool);
  if (snap.settings.maintenance || !snap.settings.enabled) {
    return { ok: false as const, reason: "MAINTENANCE" as const, snap };
  }
  if (snap.remaining <= 0) {
    return { ok: false as const, reason: "QUOTA_EXCEEDED" as const, snap };
  }
  if (tool && snap.toolUsed >= snap.toolLimit) {
    return { ok: false as const, reason: "QUOTA_EXCEEDED" as const, snap };
  }
  return { ok: true as const, snap };
}

export async function consumeUsage(
  identity: UsageIdentity,
  tool: AIToolId,
  meta?: Record<string, unknown>
) {
  const available = await assertUsageAvailable(identity, tool);
  if (!available.ok) return available;
  const snap = available.snap;

  if (!isSupabaseConfigured()) {
    return {
      ok: true as const,
      snap: { ...snap, used: snap.used + 1, remaining: snap.remaining - 1 },
      logId: null as string | null,
    };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_usage_logs")
    .insert({
      user_id: identity.userId,
      guest_key: identity.userId ? null : identity.guestKey,
      tool,
      counted: true,
      usage_date: taipeiDayKey(),
      meta: meta ?? {},
    })
    .select("id")
    .single();

  return {
    ok: true as const,
    snap: { ...snap, used: snap.used + 1, remaining: snap.remaining - 1 },
    logId: data?.id ?? null,
  };
}

export async function refundUsage(logId: string | null) {
  if (!logId || !isSupabaseConfigured()) return;
  const admin = createAdminClient();
  await admin.from("ai_usage_logs").update({ counted: false }).eq("id", logId);
}
