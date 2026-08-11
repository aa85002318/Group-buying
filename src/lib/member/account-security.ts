import { createHash, randomInt } from "crypto";
import { sendEmail, isEmailConfigured } from "@/lib/email/send";

export function generatePhoneChangeCode(): string {
  return String(randomInt(100000, 999999));
}

export function hashDeviceFingerprint(parts: {
  userAgent?: string | null;
  ip?: string | null;
}): string {
  const raw = `${parts.userAgent ?? ""}|${parts.ip ?? ""}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function summarizeUserAgent(ua: string | null | undefined): string {
  if (!ua) return "未知裝置";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "瀏覽器";
}

export async function sendPhoneChangeCodeEmail(input: {
  to: string;
  code: string;
  pendingPhone: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "郵件服務尚未設定" };
  }
  const subject = "【奇美DIY】手機號碼變更驗證碼";
  const html = `
    <div style="font-family:sans-serif;line-height:1.6;color:#153E73">
      <h2>手機號碼變更驗證</h2>
      <p>您正在將手機號碼變更為 <strong>${input.pendingPhone}</strong>。</p>
      <p>驗證碼：</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${input.code}</p>
      <p>驗證碼 10 分鐘內有效。若非本人操作，請忽略此信並盡快修改密碼。</p>
    </div>
  `;
  const result = await sendEmail({ to: input.to, subject, html });
  if (!result.ok) return { ok: false, error: result.error ?? "寄送失敗" };
  return { ok: true };
}
