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

  // The auth user is already created (admin.createUser) but unconfirmed.
  // A magiclink both confirms the email and logs the user in when clicked,
  // whereas "signup" would fail because the user already exists.
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
    let detail = "驗證信寄送失敗，請稍後再試";
    if (sent.error) {
      try {
        const parsed = JSON.parse(sent.error) as { message?: string };
        if (parsed.message) detail = parsed.message;
      } catch {
        // use default message
      }
    }
    return { ok: false, error: detail };
  }

  return { ok: true };
}
