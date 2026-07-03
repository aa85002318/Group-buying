import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export async function POST(request: Request) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;

  const body = await request.json();
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      notification: {
        id: `push-${Date.now()}`,
        title: body.title,
        body: body.body,
        sent_at: now,
      },
    });
  }

  const admin = createAdminClient();
  const { data: push, error: pushError } = await admin
    .from("push_notifications")
    .insert({
      title: body.title,
      body: body.body,
      target_role: body.targetRole,
      target_user_id: body.targetUserId,
      data: body.data ?? {},
      sent_at: now,
      created_by: auth!.profile.id,
    })
    .select()
    .single();

  if (pushError) return NextResponse.json({ error: pushError.message }, { status: 500 });

  if (body.targetUserId) {
    await admin.from("user_notifications").insert({
      user_id: body.targetUserId,
      push_notification_id: push.id,
      title: body.title,
      body: body.body,
      data: body.data ?? {},
    });
  } else {
    let profileQuery = admin.from("profiles").select("id");
    if (body.targetRole) profileQuery = profileQuery.eq("role", body.targetRole);
    const { data: profiles } = await profileQuery;
    if (profiles?.length) {
      await admin.from("user_notifications").insert(
        profiles.map((p) => ({
          user_id: p.id,
          push_notification_id: push.id,
          title: body.title,
          body: body.body,
          data: body.data ?? {},
        }))
      );
    }
  }

  await logAudit(auth!.profile.id, "send_push", "push_notification", push.id, null, push);
  return NextResponse.json({ notification: push }, { status: 201 });
}
