import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/profile";
  const state = next; // keep simple; we encodeURIComponent on redirect url below

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID?.trim();
  const redirectUri = process.env.LINE_LOGIN_REDIRECT_URI?.trim();

  if (!channelId || !redirectUri) {
    return NextResponse.json(
      {
        error: "LINE login 尚未設定：請設置 LINE_LOGIN_CHANNEL_ID / LINE_LOGIN_REDIRECT_URI",
      },
      { status: 500 }
    );
  }

  const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", channelId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", encodeURIComponent(state));
  authorizeUrl.searchParams.set("scope", "openid profile");

  return NextResponse.redirect(authorizeUrl);
}

