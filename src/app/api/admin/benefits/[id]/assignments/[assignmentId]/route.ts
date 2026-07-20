import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/** Mark used / revoke unused assignments */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id, assignmentId } = await params;
  const body = await request.json();
  const action = body.action as "mark_used" | "revoke" | "restore";

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("member_benefit_assignments")
    .select("*")
    .eq("id", assignmentId)
    .eq("benefit_id", id)
    .maybeSingle();

  if (!old) return NextResponse.json({ error: "找不到發放紀錄" }, { status: 404 });

  let updates: Record<string, unknown> = {};
  if (action === "mark_used") {
    if (old.status === "revoked") {
      return NextResponse.json({ error: "已撤銷的福利無法標記使用" }, { status: 400 });
    }
    updates = { status: "used", used_at: new Date().toISOString() };
  } else if (action === "revoke") {
    if (old.status === "used") {
      return NextResponse.json({ error: "已使用的福利不可撤銷" }, { status: 400 });
    }
    updates = { status: "revoked" };
  } else if (action === "restore") {
    updates = { status: "available", used_at: null };
  } else {
    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  }

  const { data, error: upErr } = await admin
    .from("member_benefit_assignments")
    .update(updates)
    .eq("id", assignmentId)
    .select()
    .single();

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "update",
    "member_benefit_assignment",
    assignmentId,
    old,
    data,
    request as never
  );
  return NextResponse.json({ assignment: data });
}
