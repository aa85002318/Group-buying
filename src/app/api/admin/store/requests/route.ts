import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const REQUEST_SELECT =
  "*, products(id, name, sku, barcode, stock, supplier_name, price), source_store:source_store_id(id, name), stores:store_id(id, name)";

const ALLOWED_STATUSES = [
  "pending",
  "approved",
  "partial",
  "rejected",
  "arranged",
  "handed_over",
  "fulfilled",
  "cancelled",
] as const;

async function listStores(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin
    .from("stores")
    .select("id, name, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name");
  return (data ?? []).map((s) => ({ id: s.id as string, name: s.name as string }));
}

/** List branch restock / out-of-stock collaboration requests */
export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [], stores: [] });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const kind = url.searchParams.get("kind");
  const admin = createAdminClient();
  const stores = await listStores(admin);

  let query = admin
    .from("store_requests")
    .select(REQUEST_SELECT)
    .order("created_at", { ascending: false })
    .limit(80);

  if (kind === "restock" || kind === "out_of_stock") {
    query = query.eq("request_kind", kind);
  }
  if (status === "open") {
    query = query.in("status", [
      "pending",
      "approved",
      "partial",
      "arranged",
      "handed_over",
    ]);
  } else if (status) {
    query = query.eq("status", status);
  } else {
    query = query.in("status", [
      "pending",
      "approved",
      "partial",
      "arranged",
      "handed_over",
    ]);
  }

  let { data, error: qError } = await query;
  if (qError && /source_store|reply_/i.test(qError.message)) {
    const fallback = await admin
      .from("store_requests")
      .select("*, products(id, name, sku, barcode, stock, supplier_name, price)")
      .order("created_at", { ascending: false })
      .limit(80);
    data = fallback.data as typeof data;
    qError = fallback.error;
  }
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [], stores });
}

/** Create out-of-stock notice or cross-store restock request (no inventory mutation) */
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
  const sourceStoreId =
    typeof body.source_store_id === "string" && body.source_store_id.trim()
      ? body.source_store_id.trim()
      : null;

  if (!productId && !productLabel) {
    return NextResponse.json({ error: "請選擇商品" }, { status: 400 });
  }
  if (requestKind === "restock" && quantity <= 0) {
    return NextResponse.json({ error: "請填寫需求數量" }, { status: 400 });
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
        source_store_id: sourceStoreId,
        status: "pending",
      },
      message: "需求已送出（待確認）。不會直接修改其他分店庫存。",
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

  const payload: Record<string, unknown> = {
    store_id: storeId,
    product_id: productId,
    product_label: productLabel,
    quantity,
    unit: (body.unit as string | undefined)?.trim() || null,
    note,
    request_kind: requestKind,
    source_store_id: sourceStoreId,
    status: "pending",
    requested_by: auth!.profile.id,
    requested_by_name: staffName,
  };

  let insertResult = await admin
    .from("store_requests")
    .insert(payload)
    .select(REQUEST_SELECT)
    .single();

  if (insertResult.error && /source_store/i.test(insertResult.error.message)) {
    delete payload.source_store_id;
    insertResult = await admin
      .from("store_requests")
      .insert(payload)
      .select("*, products(id, name, sku, barcode, stock, supplier_name, price)")
      .single();
  }

  const { data, error: insertError } = insertResult;
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "store_requests", data.id, null, data, request as never);

  // Notify target/source store about inbound restock request
  if (sourceStoreId && sourceStoreId !== storeId) {
    const { createStoreNotification } = await import("@/lib/admin/store-notifications");
    const productName =
      (data.products as { name?: string } | null)?.name ||
      productLabel ||
      "商品";
    await createStoreNotification(admin, {
      storeId: sourceStoreId,
      actorStoreId: storeId,
      actorUserId: auth!.profile.id,
      actorName: staffName,
      kind: "restock_request",
      title: `跨店需求：${productName}`,
      body: `數量 ${quantity}${note ? ` · ${note}` : ""}`,
      href: "/admin/store/demand",
      resourceType: "store_requests",
      resourceId: data.id,
    });
  }

  return NextResponse.json(
    {
      item: data,
      message: "需求已送出（待確認）。不會直接修改其他分店庫存。",
    },
    { status: 201 }
  );
}

/** Reply / advance collaboration status — never mutates inventory */
export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim();
  const reviewNote = (body.review_note as string | undefined)?.trim() || null;
  const replyNote = (body.reply_note as string | undefined)?.trim() || null;
  const replyQuantity =
    body.reply_quantity != null && body.reply_quantity !== ""
      ? Number(body.reply_quantity)
      : null;

  if (!id || !(ALLOWED_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "無效參數" }, { status: 400 });
  }
  if (status === "partial" && (!replyQuantity || replyQuantity <= 0)) {
    return NextResponse.json({ error: "部分供應請填寫可供應數量" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, status, reply_quantity: replyQuantity } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_requests").select("*").eq("id", id).single();
  const patch: Record<string, unknown> = { status };

  if (
    status === "approved" ||
    status === "partial" ||
    status === "rejected" ||
    status === "arranged" ||
    status === "handed_over" ||
    status === "fulfilled"
  ) {
    patch.reviewed_by = auth!.profile.id;
    patch.reviewed_at = new Date().toISOString();
  }
  if (reviewNote) patch.review_note = reviewNote;
  if (replyNote) patch.reply_note = replyNote;
  if (replyQuantity != null && !Number.isNaN(replyQuantity)) {
    patch.reply_quantity = replyQuantity;
  }
  if (status === "approved" && replyQuantity == null && old?.quantity != null) {
    patch.reply_quantity = old.quantity;
  }

  let updateResult = await admin
    .from("store_requests")
    .update(patch)
    .eq("id", id)
    .select(REQUEST_SELECT)
    .single();

  if (updateResult.error && /source_store|reply_|status/i.test(updateResult.error.message)) {
    // Soft-fallback for environments without latest migration
    const legacyStatus =
      status === "partial"
        ? "approved"
        : status === "arranged" || status === "handed_over"
          ? "approved"
          : status;
    const legacyPatch: Record<string, unknown> = {
      status: legacyStatus,
      reviewed_by: patch.reviewed_by,
      reviewed_at: patch.reviewed_at,
    };
    if (reviewNote || replyNote) legacyPatch.review_note = replyNote || reviewNote;
    updateResult = await admin
      .from("store_requests")
      .update(legacyPatch)
      .eq("id", id)
      .select("*, products(id, name, sku, barcode, stock, supplier_name, price)")
      .single();
  }

  const { data, error: uError } = updateResult;
  if (uError) return NextResponse.json({ error: uError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "store_requests", id, old, data, request as never);

  // Notify requesting store when source replies
  const requestStoreId = (data as { store_id?: string } | null)?.store_id || old?.store_id;
  if (
    requestStoreId &&
    status !== "pending" &&
    ["approved", "partial", "rejected", "arranged", "handed_over", "fulfilled"].includes(status)
  ) {
    const { createStoreNotification, STATUS_REPLY_LABEL } = await import(
      "@/lib/admin/store-notifications"
    );
    const staffName =
      (auth!.profile as { full_name?: string | null }).full_name?.trim() || "門市人員";
    const productName =
      (data.products as { name?: string } | null)?.name ||
      String(old?.product_label ?? "商品");
    const statusLabel = STATUS_REPLY_LABEL[status] || status;
    await createStoreNotification(admin, {
      storeId: String(requestStoreId),
      actorStoreId: (old as { source_store_id?: string } | null)?.source_store_id ?? null,
      actorUserId: auth!.profile.id,
      actorName: staffName,
      kind: "request_reply",
      title: `需求回覆：${productName}`,
      body: `${statusLabel}${replyQuantity != null ? ` · 可供應 ${replyQuantity}` : ""}${
        replyNote ? ` · ${replyNote}` : ""
      }`,
      href: "/admin/store/demand",
      resourceType: "store_requests",
      resourceId: id,
    });
  }

  return NextResponse.json({
    item: data,
    message: "已更新回覆狀態。不會直接修改其他分店庫存。",
  });
}
