type SendTextResult = { ok: true } | { ok: false; error: string };

const LINE_MESSAGING_PUSH_URL = "https://api.line.me/v2/bot/message/push";

export async function pushLineText(toLineUserId: string, text: string): Promise<SendTextResult> {
  const accessToken = process.env.LINE_MESSAGING_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return { ok: false, error: "LINE_MESSAGING_ACCESS_TOKEN 未設定" };
  }

  const res = await fetch(LINE_MESSAGING_PUSH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: toLineUserId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return { ok: false, error: d?.message ?? `LINE push failed: ${res.status}` };
  }

  return { ok: true };
}

