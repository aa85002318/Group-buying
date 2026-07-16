import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteMemberAccount } from "@/lib/services/accountDeletionService";

const CONFIRM_PHRASE = "刪除帳號";

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "示範模式無法刪除帳號" }, { status: 400 });
  }

  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: { confirm?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請確認刪除文字" }, { status: 400 });
  }

  if (body.confirm?.trim() !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: `請輸入「${CONFIRM_PHRASE}」以確認刪除` },
      { status: 400 }
    );
  }

  const result = await deleteMemberAccount(auth.user.id, auth.profile.role);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true, message: "帳號已刪除" });
}
