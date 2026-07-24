import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ stocktakes: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("store_stocktakes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (fetchError) {
    // Table may not exist until migration applied
    return NextResponse.json({ stocktakes: [], warning: fetchError.message });
  }

  return NextResponse.json({ stocktakes: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  let body: { title?: string; notes?: string; store_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ stocktake: { id: crypto.randomUUID(), title: body.title } });
  }

  const admin = createAdminClient();
  let storeId = body.store_id;
  if (!storeId) {
    const { data: store } = await admin
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    storeId = store?.id;
  }
  if (!storeId) {
    return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });
  }

  const { data, error: insertError } = await admin
    .from("store_stocktakes")
    .insert({
      store_id: storeId,
      title: body.title?.trim() || "盤點",
      notes: body.notes ?? null,
      status: "draft",
      created_by: auth!.profile.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await logAudit(auth!.profile.id, "create", "store_stocktakes", data.id, null, data, request as never);
  return NextResponse.json({ stocktake: data }, { status: 201 });
}
