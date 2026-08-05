import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Update store anomaly/repair status and append status trail.
 * PATCH { id, status, note? }
 */
export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const nextStatus = String(body.status ?? "").trim();
  if (!id || !nextStatus) {
    return NextResponse.json({ error: "缺少 id 或 status" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, status: nextStatus } });
  }

  const admin = createAdminClient();
  const { data: old, error: fetchError } = await admin
    .from("store_anomalies")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !old) {
    return NextResponse.json({ error: "找不到紀錄" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const staffName =
    (auth!.profile as { full_name?: string | null }).full_name?.trim() || "門市人員";

  const { data, error: updateError } = await admin
    .from("store_anomalies")
    .update({
      status: nextStatus,
      status_changed_at: now,
      ...(body.vendor_name != null ? { vendor_name: body.vendor_name } : {}),
      ...(body.resolution != null ? { resolution: body.resolution } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("store_status_logs").insert({
    store_id: old.store_id,
    resource_type: "store_anomalies",
    resource_id: id,
    from_status: old.status,
    to_status: nextStatus,
    note: (body.note as string | undefined)?.trim() || null,
    changed_by: auth!.profile.id,
    changed_by_name: staffName,
    changed_at: now,
  });

  await logAudit(
    auth!.profile.id,
    "update",
    "store_anomalies",
    id,
    old,
    data,
    request as never
  );

  const { data: logs } = await admin
    .from("store_status_logs")
    .select("*")
    .eq("resource_type", "store_anomalies")
    .eq("resource_id", id)
    .order("changed_at", { ascending: false });

  return NextResponse.json({ item: data, logs: logs ?? [] });
}

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [] });
  }

  const admin = createAdminClient();
  const { data: logs } = await admin
    .from("store_status_logs")
    .select("*")
    .eq("resource_type", "store_anomalies")
    .eq("resource_id", id)
    .order("changed_at", { ascending: false });

  return NextResponse.json({ logs: logs ?? [] });
}
