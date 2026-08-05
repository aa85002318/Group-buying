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

/** Ensure daily templates + list todos for date */
export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      todos: [
        { id: "order", label: "點貨", href: "/admin/store/batches?receive=1", is_done: false },
        { id: "fridge", label: "清冰箱", href: "/admin/store/expiry", is_done: false },
      ],
    });
  }

  const url = new URL(request.url);
  const day = url.searchParams.get("date") || todayISO();
  const admin = createAdminClient();
  const storeId = await resolveStoreId(admin, url.searchParams.get("store_id"));
  if (!storeId) return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });

  await admin.rpc("ensure_store_daily_todos", { p_store_id: storeId, p_date: day });

  const { data, error: qError } = await admin
    .from("store_todos")
    .select("*")
    .eq("store_id", storeId)
    .eq("todo_date", day)
    .order("sort_order", { ascending: true });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ todos: data ?? [], store_id: storeId, todo_date: day });
}

/** Toggle done / add manual todo */
export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, is_done: Boolean(body.is_done) } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_todos").select("*").eq("id", id).single();
  const isDone = Boolean(body.is_done);
  const patch: Record<string, unknown> = {
    is_done: isDone,
    done_at: isDone ? new Date().toISOString() : null,
    done_by: isDone ? auth!.profile.id : null,
  };

  const { data, error: uError } = await admin
    .from("store_todos")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (uError) return NextResponse.json({ error: uError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "store_todos", id, old, data, request as never);
  return NextResponse.json({ item: data });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const label = String(body.label ?? "").trim();
  if (!label) return NextResponse.json({ error: "請填寫待辦內容" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id: `tmp-${Date.now()}`, label, is_done: false } });
  }

  const admin = createAdminClient();
  const day = (body.todo_date as string | undefined) || todayISO();
  const storeId = await resolveStoreId(admin, body.store_id);
  if (!storeId) return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });

  const { data, error: insertError } = await admin
    .from("store_todos")
    .insert({
      store_id: storeId,
      todo_date: day,
      label,
      href: (body.href as string | undefined) || null,
      sort_order: Number(body.sort_order ?? 100),
      source: "manual",
    })
    .select()
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "create", "store_todos", data.id, null, data, request as never);
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const id = String(body.id ?? url.searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_todos").select("*").eq("id", id).single();
  const { error: delError } = await admin.from("store_todos").delete().eq("id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "store_todos", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
