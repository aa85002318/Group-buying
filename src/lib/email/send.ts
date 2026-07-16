import { BRAND_NAME } from "@/lib/env";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Optional Resend tags (ASCII name/value only). */
  tags?: Array<{ name: string; value: string }>;
  /** Custom headers, e.g. to reduce Gmail threading. */
  headers?: Record<string, string>;
  /** Override reply-to; default stays on the same sending domain. */
  replyTo?: string;
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || `${BRAND_NAME} <noreply@chimeidiy.com>`;
}

/** Prefer same-domain reply-to to avoid spam filters (cross-domain reply-to hurts deliverability). */
function getReplyTo(): string | undefined {
  const configured = process.env.SUPPORT_EMAIL?.trim();
  const from = getEmailFrom();
  const fromDomain = from.match(/@([^>]+)>?/)?.[1]?.toLowerCase();
  if (configured && fromDomain) {
    const supportDomain = configured.includes("@")
      ? configured.split("@")[1]?.toLowerCase()
      : "";
    if (supportDomain && supportDomain === fromDomain) return configured;
  }
  const fromAddr = from.match(/<([^>]+)>/)?.[1] ?? from;
  return fromAddr || undefined;
}

function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/(div|h1|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Send transactional email via Resend. Logs in development when not configured. */
export async function sendEmail({
  to,
  subject,
  html,
  tags,
  headers,
  replyTo,
}: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] RESEND_API_KEY not set — skipping send");
      console.log(`[email] To: ${to}`);
      console.log(`[email] Subject: ${subject}`);
    }
    return { ok: true, skipped: true };
  }

  const payload: Record<string, unknown> = {
    from: getEmailFrom(),
    to: [to],
    subject,
    html,
    text: htmlToPlainText(html),
  };

  const resolvedReplyTo = replyTo ?? getReplyTo();
  if (resolvedReplyTo) payload.reply_to = resolvedReplyTo;
  if (tags?.length) payload.tags = tags;
  if (headers && Object.keys(headers).length) payload.headers = headers;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error:", res.status, body);
    return { ok: false, error: `Resend ${res.status}: ${body}` };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  console.log("[email] sent", { to, subject, id: data.id });
  return { ok: true, id: data.id };
}

export type SendEmailResult = { ok: boolean; skipped?: boolean; error?: string; id?: string };

export { isEmailConfigured, getEmailFrom };
