import { BRAND_NAME } from "@/lib/env";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || `${BRAND_NAME} <noreply@chimeidiy.com>`;
}

function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Send transactional email via Resend. Logs in development when not configured. */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] RESEND_API_KEY not set — skipping send");
      console.log(`[email] To: ${to}`);
      console.log(`[email] Subject: ${subject}`);
    }
    return { ok: true, skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error:", res.status, body);
    return { ok: false, error: `Resend ${res.status}: ${body}` };
  }

  const payload = (await res.json().catch(() => ({}))) as { id?: string };
  console.log("[email] sent", { to, subject, id: payload.id });
  return { ok: true };
}

export type SendEmailResult = { ok: boolean; skipped?: boolean; error?: string };

export { isEmailConfigured, getEmailFrom };
