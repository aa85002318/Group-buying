import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMemberNotification } from "@/lib/services/memberNotificationService";

/** Admin broadcast in-app notifications (not push) */
export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const title = body.title?.trim();
  const message = body.message?.trim();
  const notificationType = body.notification_type ?? "system";
  const targetUserId = body.user_id?.trim() || null;

  if (!title || !message) {
    return NextResponse.json({ error: "請填寫標題與內容" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  let userIds: string[] = [];

  if (targetUserId) {
    userIds = [targetUserId];
  } else {
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "member");

    if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });
    userIds = (profiles ?? []).map((p) => p.id);
  }

  let sent = 0;
  for (const userId of userIds) {
    await createMemberNotification(admin, {
      userId,
      notificationType,
      title,
      message,
      linkUrl: body.link_url ?? null,
    });
    sent += 1;
  }

  await logAudit(auth!.profile.id, "broadcast_member_notification", "notification", null, null, {
    title,
    sent,
    targetUserId,
  });

  return NextResponse.json({ ok: true, sent });
}
