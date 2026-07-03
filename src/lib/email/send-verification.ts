import { createClient } from "@supabase/supabase-js";
import { resolveSiteUrl } from "@/lib/env";
import { sendEmail, isEmailConfigured } from "@/lib/email/send";
import { buildVerifyEmail } from "@/lib/email/templates/verify-email";

export interface SendVerificationEmailInput {
  email: string;
  origin?: string;
}

export interface SendVerificationEmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/** Send signup verification to the registrant via Resend (explicit To address). */
export async function sendVerificationEmail({
  email,
  origin,
}: SendVerificationEmailInput): Promise<SendVerificationEmailResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, error: "請提供 Email" };
  }

  if (!isEmailConfigured()) {
    return { ok: false, skipped: true, error: "尚未設定 RESEND_API_KEY" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: "尚未設定 Supabase 服務金鑰" };
  }

  const siteUrl = resolveSiteUrl({ origin });
  const redirectTo = `${siteUrl}/auth/callback`;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: trimmed,
    options: { redirectTo },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const confirmationUrl = data.properties?.action_link;
  if (!confirmationUrl) {
    return { ok: false, error: "無法產生驗證連結" };
  }

  const { subject, html } = buildVerifyEmail({
    confirmationUrl,
    recipientEmail: trimmed,
  });

  const sent = await sendEmail({ to: trimmed, subject, html });
  if (!sent.ok) {
    return { ok: false, error: "驗證信寄送失敗，請稍後再試" };
  }

  return { ok: true };
}
