import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * AI 串接自我檢查（只有管理員能看）。
 *
 * 回傳「有沒有設定」和「試打一次通不通」，**永遠不回傳金鑰本身**，
 * 連前幾碼都不給——只給長度，用來分辨是不是整串貼錯或貼成空字串。
 */
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim() ?? "";
  const openaiKey = process.env.OPENAI_API_KEY?.trim() ?? "";

  const providers = [
    {
      name: "vercel_ai_gateway",
      label: "Vercel AI Gateway / Token Pass",
      envVar: "AI_GATEWAY_API_KEY",
      configured: Boolean(gatewayKey),
      keyLength: gatewayKey.length || null,
      model: process.env.AI_GATEWAY_MODEL?.trim() || "zai/glm-5.3",
      url: "https://ai-gateway.vercel.sh/v1/chat/completions",
      key: gatewayKey,
    },
    {
      name: "openai",
      label: "OpenAI",
      envVar: "OPENAI_API_KEY",
      configured: Boolean(openaiKey),
      keyLength: openaiKey.length || null,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      url: "https://api.openai.com/v1/chat/completions",
      key: openaiKey,
    },
  ];

  const results = await Promise.all(
    providers.map(async (p) => {
      const base = {
        provider: p.name,
        label: p.label,
        env_var: p.envVar,
        configured: p.configured,
        key_length: p.keyLength,
        model: p.model,
      };
      if (!p.configured) {
        return { ...base, ok: false, status: null, hint: "這個環境變數沒有設定" };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch(p.url, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${p.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: p.model,
            max_tokens: 8,
            messages: [{ role: "user", content: "ping" }],
          }),
        });
        const hint =
          res.ok
            ? "可以用"
            : res.status === 401
              ? "金鑰無效或貼錯"
              : res.status === 403
                ? "額度用完，或這把金鑰不能用這個模型（Token Pass 只能用 zai/glm-5.3、moonshotai/kimi-k3）"
                : res.status === 404
                  ? "模型名稱錯誤"
                  : res.status === 429
                    ? "被限流，稍後再試"
                    : `回應 ${res.status}`;
        return { ...base, ok: res.ok, status: res.status, hint };
      } catch {
        return { ...base, ok: false, status: null, hint: "連不上（逾時或網路問題）" };
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const working = results.find((r) => r.ok) ?? null;

  return NextResponse.json({
    ai_explain_enabled: Boolean(working),
    active_provider: working?.provider ?? null,
    summary: working
      ? `AI 敘述可用，目前走 ${working.label}（${working.model}）`
      : "AI 敘述沒有啟動：前台只會顯示食譜檢索與換算結果",
    providers: results,
  });
}
