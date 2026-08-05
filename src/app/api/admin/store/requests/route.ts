import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/** List pending / recent branch restock requests */
export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [] });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const kind = url.searchParams.get("kind");
  const admin = createAdminClient();

  let query = admin
    .from("store_requests")
    .select("*, products(id, name, sku)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (kind === "restock" || kind === "out_of_stock") {
    query = query.eq("request_kind", kind);
  }
  if (status) query = query.eq("status", status);
  else query = query.in("status", ["pending", "approved"]);

  const { data, error: qError } = await query;
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

/** Create out-of-stock notice or restock request */
export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const productId = (body.product_id as string | undefined)?.trim() || null;
  const productLabel =
    (body.product_label as string | undefined)?.trim() ||
    (body.product_name as string | undefined)?.trim() ||
    null;
  const requestKind =
    body.request_kind === "out_of_stock" ? "out_of_stock" : "restock";
  const quantity = Number(body.quantity ?? 1) || 1;
  const note = String(body.note ?? "").trim() || null;

  if (!productId && !productLabel) {
    return NextResponse.json({ error: "請選擇商品" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      item: {
        id: `tmp-${Date.now()}`,
        request_kind: requestKind,
        product_id: productId,
        product_label: productLabel,
        quantity,
        note,
        status: "pending",
      },
    });
  }

  const admin = createAdminClient();
  let storeId = (body.store_id as string | undefined) || null;
  if (!storeId) {
    const { data: store } = await admin
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    storeId = store?.id ?? null;
  }
  if (!storeId) return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });

  const staffName =
    (auth!.profile as { full_name?: string | null }).full_name?.trim() || "門市人員";

  const { data, error: insertError } = await admin
    .from("store_requests")
    .insert({
      store_id: storeId,
      product_id: productId,
      product_label: productLabel,
      quantity,
      unit: (body.unit as string | undefined)?.trim() || null,
      note,
      request_kind: requestKind,
      status: "pending",
      requested_by: auth!.profile.id,
      requested_by_name: staffName,
    })
    .select("*, products(id, name, sku)")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "store_requests", data.id, null, data, request as never);
  return NextResponse.json({ item: data }, { status: 201 });
}

/** Approve / reject / fulfil a request */
export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim();
  const reviewNote = (body.review_note as string | undefined)?.trim() || null;

  if (!id || !["approved", "rejected", "fulfilled", "cancelled", "pending"].includes(status)) {
    return NextResponse.json({ error: "無效參數" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, status } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_requests").select("*").eq("id", id).single();
  const patch: Record<string, unknown> = { status };
  if (status === "approved" || status === "rejected" || status === "fulfilled") {
    patch.reviewed_by = auth!.profile.id;
    patch.reviewed_at = new Date().toISOString();
    if (reviewNote) patch.review_note = reviewNote;
  }

  const { data, error: uError } = await admin
    .from("store_requests")
    .update(patch)
    .eq("id", id)
    .select("*, products(id, name, sku)")
    .single();
  if (uError) return NextResponse.json({ error: uError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "store_requests", id, old, data, request as never);
  return NextResponse.json({ item: data });
}
