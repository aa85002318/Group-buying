import { loadEnvLocal } from "./load-env";
import { createClient } from "@supabase/supabase-js";

/** Send a FIXED verification email (app callback + token_hash) for manual click-test. */
async function main() {
  loadEnvLocal();

  const to = (process.env.TEST_VERIFY_EMAIL ?? "aa85002318@diychimei.page").trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const emailFrom = process.env.EMAIL_FROM!.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://shop.chimeidiygroupbuying.com"
  ).replace(/\/$/, "");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: to,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (error || !data.properties?.hashed_token) {
    console.error("generateLink failed:", error?.message ?? "no hashed_token");
    process.exit(1);
  }

  const confirmationUrl =
    `${siteUrl}/auth/callback` +
    `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=magiclink&next=/`;

  console.log("Confirm URL host:", new URL(confirmationUrl).host);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [to],
      subject: "請驗證您的 chimeidiy 團購帳號（修正版連結）",
      html: `
        <p>您好，</p>
        <p>請點擊下方按鈕完成 Email 驗證（此為<strong>修正版</strong>連結）：</p>
        <p><a href="${confirmationUrl}" style="display:inline-block;padding:12px 20px;background:#6B4423;color:#fff;text-decoration:none;border-radius:8px;">驗證 Email</a></p>
        <p style="font-size:12px;word-break:break-all;color:#888">${confirmationUrl}</p>
      `,
    }),
  });

  console.log("Resend HTTP", res.status, await res.text());
  if (!res.ok) process.exit(1);
  console.log(`Sent fixed verification email to ${to}`);
  console.log("NOTE: Deploy callback fix to Vercel BEFORE clicking, or verify on localhost after deploy.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
