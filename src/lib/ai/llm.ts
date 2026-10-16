/** Optional narrative layer. Never used for weights / temperatures. */

const TIMEOUT_MS = 8000;

const SYSTEM_PROMPT =
  "你是 CHIMEIDIY 烘焙助手。只解釋已計算或已檢索的結果，不可改數字、不可保證成功、不可宣稱食品無過敏原、不可下單或改會員資料。繁體中文、語氣務實。";

/**
 * 兩種供應商：
 * - Vercel AI Gateway / Token Pass：AI_GATEWAY_API_KEY，OpenAI 相容端點。
 *   Token Pass 的金鑰只能用「featured models」（zai/glm-5.3、moonshotai/kimi-k3），
 *   額度用完會回 403。
 * - OpenAI：OPENAI_API_KEY，原本的用法。
 *
 * 兩個都設的話先用 Token Pass，額度用完（403）自動改走 OpenAI，
 * AI 區塊不會整個啞掉。兩個都沒設就回 null（和以前一樣，前台只是不顯示敘述）。
 */
type Provider = {
  name: "gateway" | "openai";
  url: string;
  key: string;
  model: string;
};

function providers(): Provider[] {
  const out: Provider[] = [];
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (gatewayKey) {
    out.push({
      name: "gateway",
      url: "https://ai-gateway.vercel.sh/v1/chat/completions",
      key: gatewayKey,
      model: process.env.AI_GATEWAY_MODEL?.trim() || "zai/glm-5.3",
    });
  }
  if (openaiKey) {
    out.push({
      name: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      key: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    });
  }
  return out;
}

async function ask(provider: Provider, prompt: string): Promise<{ text: string | null; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(provider.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.3,
        max_tokens: 280,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt.slice(0, 1600) },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 403 && provider.name === "gateway") {
        // Token Pass 額度用完，或金鑰不能用這個模型。
        console.warn("[ai] Token Pass 回 403（額度用完或模型不在方案內）");
      }
      return { text: null, status: res.status };
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return { text: json.choices?.[0]?.message?.content?.trim() || null, status: 200 };
  } catch {
    return { text: null, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

export async function maybeExplain(prompt: string): Promise<string | null> {
  const list = providers();
  if (!list.length) return null;

  for (const provider of list) {
    const { text, status } = await ask(provider, prompt);
    if (text) return text;
    // 只有「這個供應商不能用」才換下一個；其他錯誤就安靜放棄。
    const worthFallback = status === 403 || status === 401 || status === 429;
    if (!worthFallback) return null;
  }
  return null;
}
