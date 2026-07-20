import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  if (body.confirmText !== "刪除帳號") {
    return NextResponse.json({ error: "請輸入「刪除帳號」以確認" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, message: "您的刪除帳號申請已送出，我們會盡快處理。" });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("account_deletion_requests")
    .select("id")
    .eq("user_id", auth!.profile.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "您已有待處理的刪除申請" }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("account_deletion_requests").insert({
    user_id: auth!.profile.id,
    reason: body.reason?.trim() || null,
  });

  if (insertError) return NextResponse.json({ error: "申請失敗" }, { status: 500 });
  return NextResponse.json({ ok: true, message: "您的刪除帳號申請已送出，我們會盡快處理。" });
}
