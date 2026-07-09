/** Map Supabase / auth API errors to user-friendly Traditional Chinese messages. */
export function getAuthErrorMessage(err: unknown, context: "register" | "resend" = "register"): string {
  const text = extractErrorText(err).toLowerCase();

  if (
    text.includes("only request this after") ||
    text.includes("rate limit") ||
    text.includes("too many requests") ||
    text.includes("email rate limit")
  ) {
    const seconds = text.match(/after (\d+) seconds?/)?.[1];
    const wait = seconds ? `${seconds} 秒` : "約 1 分鐘";
    return context === "resend"
      ? `操作太頻繁，請等待 ${wait} 後再按「重新寄送驗證信」。`
      : `註冊操作太頻繁，請等待 ${wait} 後再試，不要重複按送出。`;
  }

  if (err && typeof err === "object") {
    const maybe = err as Record<string, unknown>;
    const name = typeof maybe.name === "string" ? maybe.name : "";
    const status = typeof maybe.status === "number" ? maybe.status : 0;
    if (name === "AuthRetryableFetchError" || status >= 500) {
      return "註冊失敗：Supabase Auth 服務暫時錯誤。請到 Supabase 關閉錯誤的自訂 SMTP，或改為正確的 Resend SMTP 設定後再試。";
    }
  }

  if (
    text.includes("redirect_to") ||
    text.includes("not allowed") ||
    text.includes("url not allowed")
  ) {
    return "註冊失敗：Supabase 尚未允許目前網址。請到 Authentication → URL Configuration，加入 https://chimeidiygroupbuying.com/auth/callback";
  }

  if (text.includes("註冊資料已逾時")) {
    return "註冊資料已逾時。若先前曾註冊過，請直接登入；或聯絡客服協助完成會員資料。";
  }

  if (text.includes("此帳號已註冊完成")) {
    return "此帳號已註冊完成，請直接登入。若未驗證 Email，可在登入頁重新寄送驗證信。";
  }

  if (text.includes("user already registered") || text.includes("already been registered")) {
    return "此 Email 已註冊，請直接登入或使用「重新寄送驗證信」。";
  }

  const raw = extractErrorText(err);
  if (raw && raw !== "{}") return raw;

  return context === "resend"
    ? "寄送失敗，請稍後再試。"
    : "註冊失敗，請稍後再試。";
}

function extractErrorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (!err || typeof err !== "object") return "";
  const maybe = err as Record<string, unknown>;
  return [maybe.message, maybe.error_description, maybe.error, maybe.msg]
    .filter((v): v is string => typeof v === "string")
    .join(" ");
}
