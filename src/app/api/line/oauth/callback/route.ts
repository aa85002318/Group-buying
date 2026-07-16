import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  const next = state ? decodeURIComponent(state) : "/profile";

  if (error) {
    return NextResponse.redirect(`/auth/login?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`);
  }

  if (!code) {
    return NextResponse.json({ error: "LINE callback missing code" }, { status: 400 });
  }

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID?.trim();
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET?.trim();
  const redirectUri = process.env.LINE_LOGIN_REDIRECT_URI?.trim();
  if (!channelId || !channelSecret || !redirectUri) {
    return NextResponse.json(
      { error: "LINE login 尚未設定：LINE_LOGIN_CHANNEL_ID / LINE_LOGIN_CHANNEL_SECRET / LINE_LOGIN_REDIRECT_URI" },
      { status: 500 }
    );
  }

  // 1) Exchange authorization code for access token
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });

  if (!tokenRes.ok) {
    const d = await tokenRes.json().catch(() => ({}));
    return NextResponse.json({ error: "LINE token exchange failed", details: d }, { status: 500 });
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.json({ error: "LINE token missing access_token" }, { status: 500 });
  }

  // 2) Fetch LINE user profile (userinfo includes `sub` for userId)
  const userInfoRes = await fetch("https://api.line.me/oauth2/v2.1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userInfoRes.ok) {
    const d = await userInfoRes.json().catch(() => ({}));
    return NextResponse.json({ error: "LINE userinfo failed", details: d }, { status: 500 });
  }

  const userInfo = (await userInfoRes.json()) as Record<string, unknown>;
  const lineUserId =
    (typeof userInfo.sub === "string" && userInfo.sub) ||
    (typeof userInfo.userId === "string" && userInfo.userId) ||
    (typeof userInfo.id === "string" && userInfo.id);

  if (!lineUserId) {
    return NextResponse.json({ error: "LINE userId not found in userinfo" }, { status: 500 });
  }

  // 3) If user already logged in to Supabase, bind immediately. Otherwise redirect to email login.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (authData.user?.id) {
    const admin = createAdminClient();
    const { error: upsertError } = await admin.from("line_bindings").upsert(
      { user_id: authData.user.id, line_user_id: lineUserId },
      { onConflict: "line_user_id" }
    );

    if (upsertError) {
      return NextResponse.json({ error: "LINE 綁定失敗", details: upsertError.message }, { status: 500 });
    }

    return NextResponse.redirect(next);
  }

  return NextResponse.redirect(
    `/auth/login?line_user_id=${encodeURIComponent(String(lineUserId))}&next=${encodeURIComponent(next)}`
  );
}

