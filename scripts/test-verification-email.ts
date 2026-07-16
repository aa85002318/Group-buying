import { loadEnvLocal } from "./load-env";
import { createClient } from "@supabase/supabase-js";

async function main() {
  loadEnvLocal();

  const to = (process.env.TEST_VERIFY_EMAIL ?? "aa85002318@diychimei.page").trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  console.log("=== Verification email diagnostic ===");
  console.log("Target email:", to);
  console.log("RESEND_API_KEY:", apiKey ? `${apiKey.slice(0, 8)}...` : "(missing)");
  console.log("EMAIL_FROM:", emailFrom ?? "(missing)");

  if (!apiKey || !emailFrom || !supabaseUrl || !serviceKey) {
    console.error("Missing required env vars");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://shop.chimeidiygroupbuying.com";
  const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback`;
  console.log("redirectTo:", redirectTo);

  // Ensure user exists (create if missing)
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = listed?.users.find((u) => u.email?.toLowerCase() === to);

  if (!user) {
    console.log("User not found — creating temporary auth user…");
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: to,
      password: `Tmp-${Date.now()}!`,
      email_confirm: false,
      user_metadata: { full_name: "寄信診斷" },
    });
    if (createError || !created.user) {
      console.error("createUser failed:", createError?.message);
      process.exit(1);
    }
    user = created.user;
    console.log("Created user:", user.id);
  } else {
    console.log("Found user:", user.id, user.email_confirmed_at ? "(verified)" : "(unverified)");
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: to,
    options: { redirectTo },
  });

  if (linkError) {
    console.error("generateLink FAILED:", linkError.message);
    process.exit(1);
  }

  const actionLink = linkData.properties?.action_link;
  console.log("generateLink OK:", actionLink ? "got action_link" : "NO action_link");
  if (!actionLink) process.exit(1);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [to],
      subject: "請驗證您的 chimeidiy 團購帳號（診斷測試）",
      html: `<p>這是驗證信診斷測試。</p><p><a href="${actionLink}">點此驗證 Email</a></p><p style="font-size:12px;word-break:break-all">${actionLink}</p>`,
    }),
  });

  const body = await res.text();
  console.log("Resend HTTP", res.status);
  console.log(body);

  if (!res.ok) {
    console.error("Result: Resend rejected the send — check domain / from address.");
    process.exit(1);
  }

  console.log("Result: Verification-style email accepted by Resend.");
  console.log(`Please check inbox (and spam) for: ${to}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
