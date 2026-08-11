import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { deidentifyLabel } from "./moderation";

export type AnalyticsEventType =
  | "ask"
  | "recipe_click"
  | "product_click"
  | "add_to_cart"
  | "failure";

function taipeiDay(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(d);
}

export async function trackAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  tool?: string;
  label?: string;
}) {
  if (!isSupabaseConfigured()) return;
  const admin = createAdminClient();
  await admin.from("ai_analytics_events").insert({
    event_type: input.eventType,
    tool: input.tool ?? null,
    label: input.label ? deidentifyLabel(input.label) : null,
    usage_date: taipeiDay(),
  });
}

export async function logAIError(input: {
  tool?: string;
  code: string;
  message: string;
  userId?: string | null;
}) {
  if (!isSupabaseConfigured()) return;
  const admin = createAdminClient();
  await admin.from("ai_error_logs").insert({
    user_id: input.userId ?? null,
    tool: input.tool ?? null,
    code: input.code,
    message: input.message.slice(0, 300),
  });
}

function topCounts(rows: Array<{ label?: string | null }>, n = 5) {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const k = deidentifyLabel(String(row.label ?? "").trim());
    if (!k) continue;
    map[k] = (map[k] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

export async function getAIAdminStats() {
  if (!isSupabaseConfigured()) {
    return {
      todayUsers: 0,
      todayAsks: 0,
      successRate: "—",
      avgMs: "—",
      failures: 0,
      topTool: "—",
      topIngredients: [],
      topFailures: [],
      recipeCtr: "—",
      productCtr: "—",
      cartCvr: "—",
    };
  }

  const admin = createAdminClient();
  const today = taipeiDay();

  const { count: asks } = await admin
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("usage_date", today)
    .eq("counted", true);
  const { data: users } = await admin
    .from("ai_usage_logs")
    .select("user_id, guest_key, tool, meta")
    .eq("usage_date", today);
  const uniq = new Set((users ?? []).map((u) => u.user_id ?? u.guest_key ?? "x"));
  const toolCounts: Record<string, number> = {};
  let durationSum = 0;
  let durationN = 0;
  for (const row of users ?? []) {
    const k = String(row.tool ?? "chat");
    toolCounts[k] = (toolCounts[k] ?? 0) + 1;
    const ms = Number((row.meta as { durationMs?: number } | null)?.durationMs);
    if (Number.isFinite(ms) && ms > 0) {
      durationSum += ms;
      durationN += 1;
    }
  }
  const topTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const { count: failures } = await admin
    .from("ai_error_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00+08:00`);

  const askN = asks ?? 0;
  const failN = failures ?? 0;
  const successRate =
    askN + failN === 0 ? "—" : `${Math.round((askN / (askN + failN)) * 100)}%`;
  const avgMs = durationN === 0 ? "—" : `${Math.round(durationSum / durationN)} ms`;

  const { data: events } = await admin
    .from("ai_analytics_events")
    .select("event_type, tool, label")
    .eq("usage_date", today);

  const recipeClicks = (events ?? []).filter((e) => e.event_type === "recipe_click").length;
  const productClicks = (events ?? []).filter((e) => e.event_type === "product_click").length;
  const carts = (events ?? []).filter((e) => e.event_type === "add_to_cart").length;
  const ingredientAsks = (events ?? []).filter(
    (e) => e.event_type === "ask" && e.tool === "recipes"
  );
  const failureAsks = (events ?? []).filter(
    (e) => e.event_type === "ask" && e.tool === "failure"
  );

  const pct = (num: number, den: number) =>
    den === 0 ? "—" : `${Math.round((num / den) * 100)}%`;

  return {
    todayUsers: uniq.size,
    todayAsks: askN,
    successRate,
    avgMs,
    failures: failN,
    topTool,
    topIngredients: topCounts(ingredientAsks),
    topFailures: topCounts(failureAsks),
    recipeCtr: pct(recipeClicks, askN),
    productCtr: pct(productClicks, askN),
    cartCvr: pct(carts, productClicks || askN),
  };
}
