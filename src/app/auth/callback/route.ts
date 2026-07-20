import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrlFromRequest } from "@/lib/env";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

function errorRedirect(siteUrl: string, reason: string) {
  return NextResponse.redirect(`${siteUrl}/auth/error?reason=${encodeURIComponent(reason)}`);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const siteUrl = requestUrl.origin || getSiteUrlFromRequest(request);
  const redirectPath = getSafeRedirectPath(next, "/");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${redirectPath}`);
    }
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return errorRedirect(siteUrl, "code");
  }

  if (tokenHash && typeParam) {
    const type = typeParam as EmailOtpType;
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${redirectPath}`);
    }
    console.error("[auth/callback] verifyOtp:", error.message);

    // Retry common alternate types (link generated as magiclink / email / signup)
    for (const alt of ["magiclink", "email", "signup"] as EmailOtpType[]) {
      if (alt === type) continue;
      const retry = await supabase.auth.verifyOtp({ type: alt, token_hash: tokenHash });
      if (!retry.error) {
        return NextResponse.redirect(`${siteUrl}${redirectPath}`);
      }
    }

    const expired =
      error.message.toLowerCase().includes("expired") ||
      error.message.toLowerCase().includes("otp");
    return errorRedirect(siteUrl, expired ? "expired" : "otp");
  }

  return errorRedirect(siteUrl, "missing");
}
