import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Audience = "all" | "users" | "group_buy";

async function resolveUserIds(
  admin: ReturnType<typeof createAdminClient>,
  audience: Audience,
  userIds: string[],
  groupBuyEventId?: string | null
): Promise<{ userIds: string[]; estimate: number; error?: string }> {
  if (audience === "users") {
    const unique = Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
    return { userIds: unique, estimate: unique.length };
  }

  if (audience === "all") {
    const { data } = await admin.from("profiles").select("id").eq("role", "member");
    if (!data?.length) {
      const { data: all } = await admin.from("profiles").select("id, role");
      const ids = (all ?? [])
        .filter((p) => p.role !== "admin" && p.role !== "store_staff")
        .map((p) => p.id);
      return { userIds: ids, estimate: ids.length };
    }
    return { userIds: data.map((p) => p.id), estimate: data.length };
  }

  if (audience === "group_buy") {
    if (!groupBuyEventId) return { userIds: [], estimate: 0, error: "請指定團購活動" };
    const { data: gbp } = await admin
      .from("group_buy_products")
      .select("id")
      .eq("group_buy_event_id", groupBuyEventId);
    const gbpIds = (gbp ?? []).map((g) => g.id);
    if (!gbpIds.length) return { userIds: [], estimate: 0 };

    const { data: items } = await admin
      .from("order_items")
      .select("order_id")
      .in("group_buy_product_id", gbpIds);
    const orderIds = Array.from(new Set((items ?? []).map((i) => i.order_id).filter(Boolean)));
    if (!orderIds.length) return { userIds: [], estimate: 0 };

    const { data: orders } = await admin.from("orders").select("user_id").in("id", orderIds);
    const ids = Array.from(
      new Set((orders ?? []).map((o) => o.user_id).filter(Boolean))
    ) as string[];
    return { userIds: ids, estimate: ids.length };
  }

  return { userIds: [], estimate: 0, error: "未知發放對象" };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const audience = (searchParams.get("audience") ?? "all") as Audience;
  const groupBuyEventId = searchParams.get("group_buy_event_id");
  const userIds = (searchParams.get("user_ids") ?? "").split(/[\s,]+/).filter(Boolean);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ estimate: 0, benefit_id: id, will_assign: 0, already_assigned: 0 });
  }

  const admin = createAdminClient();
  const result = await resolveUserIds(admin, audience, userIds, groupBuyEventId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  if (!result.userIds.length) {
    return NextResponse.json({ estimate: 0, already_assigned: 0, will_assign: 0 });
  }

  const { data: existing } = await admin
    .from("member_benefit_assignments")
    .select("user_id")
    .eq("benefit_id", id)
    .in("user_id", result.userIds)
    .neq("status", "revoked");

  const already = new Set((existing ?? []).map((e) => e.user_id));
  const newCount = result.userIds.filter((uid) => !already.has(uid)).length;

  return NextResponse.json({
    estimate: result.estimate,
    already_assigned: already.size,
    will_assign: newCount,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const audience = (body.audience ?? "users") as Audience;
  if (!Boolean(body.confirm)) {
    return NextResponse.json({ error: "請二次確認後再發放" }, { status: 400 });
  }

  const userIdsInput: string[] = Array.isArray(body.user_ids)
    ? body.user_ids
    : String(body.user_ids_text ?? "")
        .split(/[\s,]+/)
        .filter(Boolean);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ assigned: 0, skipped: 0, restored: 0 });
  }

  const admin = createAdminClient();
  const { data: benefit } = await admin.from("member_benefits").select("*").eq("id", id).maybeSingle();
  if (!benefit) return NextResponse.json({ error: "找不到福利" }, { status: 404 });
  if (benefit.status !== "active") {
    return NextResponse.json({ error: "僅能發放「啟用」中的福利" }, { status: 400 });
  }

  const resolved = await resolveUserIds(admin, audience, userIdsInput, body.group_buy_event_id);
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: 400 });
  if (!resolved.userIds.length) {
    return NextResponse.json({ error: "沒有可發放的會員" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("member_benefit_assignments")
    .select("user_id, status, id")
    .eq("benefit_id", id)
    .in("user_id", resolved.userIds);

  const byUser = new Map((existing ?? []).map((e) => [e.user_id, e]));
  let assigned = 0;
  let skipped = 0;
  let restored = 0;

  const source =
    audience === "all" ? "all_members" : audience === "group_buy" ? "group_buy" : "user_list";

  const rowsToInsert: Array<Record<string, unknown>> = [];

  for (const userId of resolved.userIds) {
    const prev = byUser.get(userId);
    if (prev && prev.status !== "revoked") {
      skipped += 1;
      continue;
    }
    if (prev && prev.status === "revoked") {
      const { error: upErr } = await admin
        .from("member_benefit_assignments")
        .update({
          status: "available",
          assigned_by: auth!.profile.id,
          assigned_at: new Date().toISOString(),
          used_at: null,
          starts_at: benefit.starts_at,
          ends_at: benefit.ends_at,
          source,
          note: body.note?.trim() || null,
        })
        .eq("id", prev.id);
      if (!upErr) restored += 1;
      continue;
    }
    rowsToInsert.push({
      benefit_id: id,
      user_id: userId,
      status: "available",
      assigned_by: auth!.profile.id,
      starts_at: benefit.starts_at,
      ends_at: benefit.ends_at,
      source,
      note: body.note?.trim() || null,
    });
  }

  if (rowsToInsert.length) {
    const { error: insErr, data: inserted } = await admin
      .from("member_benefit_assignments")
      .insert(rowsToInsert)
      .select("id");
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    assigned = inserted?.length ?? rowsToInsert.length;
  }

  await logAudit(
    auth!.profile.id,
    "create",
    "member_benefit_assignment",
    id,
    null,
    { audience, assigned, skipped, restored, estimate: resolved.estimate },
    request as never
  );

  return NextResponse.json({ assigned, skipped, restored, estimate: resolved.estimate });
}
