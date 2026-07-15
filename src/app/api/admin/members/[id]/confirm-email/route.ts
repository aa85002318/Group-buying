import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/** Admin manually marks a member's email as verified (when verification mail was never received). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, email_verified: true, skipped: true });
  }

  const admin = createAdminClient();

  const { data: authUser, error: getError } = await admin.auth.admin.getUserById(id);
  if (getError || !authUser.user) {
    return NextResponse.json({ error: "找不到會員帳號" }, { status: 404 });
  }

  if (authUser.user.email_confirmed_at) {
    return NextResponse.json({
      ok: true,
      email_verified: true,
      already: true,
      message: "此帳號 Email 已是驗證狀態",
    });
  }

  const { data, error: updateError } = await admin.auth.admin.updateUserById(id, {
    email_confirm: true,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await logAudit(auth!.profile.id, "confirm_member_email", "auth.users", id, {
    email: authUser.user.email,
    email_confirmed_at: null,
  }, {
    email: data.user.email,
    email_confirmed_at: data.user.email_confirmed_at,
  });

  return NextResponse.json({
    ok: true,
    email_verified: true,
    email: data.user.email,
    email_confirmed_at: data.user.email_confirmed_at,
    message: "已手動驗證 Email，會員現在可以登入與下單",
  });
}
