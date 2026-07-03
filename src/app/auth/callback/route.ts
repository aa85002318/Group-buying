import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrlFromRequest } from "@/lib/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Keep users on the same host they used (e.g. LAN IP on mobile).
  const siteUrl = requestUrl.origin || getSiteUrlFromRequest(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next.startsWith("/") ? next : `/${next}`}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/auth/error`);
}
