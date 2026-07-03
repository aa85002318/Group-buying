import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveSiteUrl } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "尚未設定 Supabase" }, { status: 503 });
  }

  const { email, origin } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "請提供 Email" }, { status: 400 });
  }

  const supabase = await createClient();
  const siteUrl = resolveSiteUrl({ origin, request });
  let { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    const msg = [error.message, (error as { error_description?: string }).error_description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (
      msg.includes("redirect") ||
      msg.includes("redirect_to") ||
      msg.includes("not allowed") ||
      msg.includes("url not allowed")
    ) {
      const retry = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      error = retry.error;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "驗證信已寄出，請查收信箱" });
}
