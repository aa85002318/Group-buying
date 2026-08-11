/** Optional narrative layer. Never used for weights / temperatures. */

const TIMEOUT_MS = 8000;

export async function maybeExplain(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "你是 CHIMEIDIY 烘焙助手。只解釋已計算或已檢索的結果，不可改數字、不可保證成功、不可宣稱食品無過敏原、不可下單或改會員資料。繁體中文、語氣務實。",
          },
          { role: "user", content: prompt.slice(0, 1600) },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
