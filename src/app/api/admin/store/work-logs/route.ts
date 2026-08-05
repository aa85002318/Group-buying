import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayISO } from "@/lib/admin/store-ops";

async function resolveStoreId(admin: ReturnType<typeof createAdminClient>, storeId?: string | null) {
  if (storeId) return storeId;
  const { data } = await admin.from("stores").select("id").eq("is_active", true).limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [] });
  }

  const url = new URL(request.url);
  const day = url.searchParams.get("date") || todayISO();
  const admin = createAdminClient();
  const storeId = await resolveStoreId(admin, url.searchParams.get("store_id"));
  if (!storeId) return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });

  const { data, error: qError } = await admin
    .from("store_work_logs")
    .select("*")
    .eq("store_id", storeId)
    .eq("log_date", day)
    .order("created_at", { ascending: false });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ logs: data ?? [], store_id: storeId, log_date: day });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const bodyText = String(body.body ?? body.note ?? "").trim();
  if (!bodyText) return NextResponse.json({ error: "請填寫工作紀錄" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      item: { id: `tmp-${Date.now()}`, body: bodyText, log_date: todayISO() },
    });
  }

  const admin = createAdminClient();
  const day = (body.log_date as string | undefined) || todayISO();
  const storeId = await resolveStoreId(admin, body.store_id);
  if (!storeId) return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });

  const staffName =
    (auth!.profile as { full_name?: string | null }).full_name?.trim() || "門市人員";

  const { data, error: insertError } = await admin
    .from("store_work_logs")
    .insert({
      store_id: storeId,
      log_date: day,
      body: bodyText,
      author_id: auth!.profile.id,
      author_name: staffName,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "store_work_logs", data.id, null, data, request as never);
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? new URL(request.url).searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_work_logs").select("*").eq("id", id).single();
  const { error: delError } = await admin.from("store_work_logs").delete().eq("id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "store_work_logs", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
