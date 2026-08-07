import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  StoreCustomerRequestStatus,
  StoreCustomerRequestType,
  StoreCustomerSource,
} from "@/lib/admin/store-pos-lite";

async function resolveStoreId(admin: ReturnType<typeof createAdminClient>, preferred?: string | null) {
  if (preferred) return preferred;
  const { data } = await admin.from("stores").select("id").eq("is_active", true).limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [], todayCount: 0, stores: [] });
  }

  const { searchParams } = new URL(request.url);
  const day = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const type = searchParams.get("type") as StoreCustomerRequestType | null;
  const status = searchParams.get("status");
  const storeIdParam = searchParams.get("store_id");

  const admin = createAdminClient();
  const storeId = await resolveStoreId(admin, storeIdParam);
  if (!storeId) return NextResponse.json({ items: [], todayCount: 0, stores: [] });

  const storesRes = await admin
    .from("stores")
    .select("id, name, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name");
  const stores = (storesRes.data ?? []).map((s) => ({ id: s.id as string, name: s.name as string }));

  let query = admin
    .from("store_customer_requests")
    .select(
      "*, products(id, name, sku, barcode, supplier_name, price, unit, brands(name)), suppliers(id, name), pickup_store:pickup_store_id(id, name)"
    )
    .eq("store_id", storeId)
    .gte("created_at", `${day}T00:00:00`)
    .lte("created_at", `${day}T23:59:59.999`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (type === "order" || type === "price_inquiry") query = query.eq("request_type", type);
  if (status) query = query.eq("status", status);

  let { data, error: fetchError } = await query;
  if (fetchError && /pickup_store/i.test(fetchError.message)) {
    const fallback = await admin
      .from("store_customer_requests")
      .select(
        "*, products(id, name, sku, barcode, supplier_name, price, unit, brands(name)), suppliers(id, name)"
      )
      .eq("store_id", storeId)
      .gte("created_at", `${day}T00:00:00`)
      .lte("created_at", `${day}T23:59:59.999`)
      .order("created_at", { ascending: false })
      .limit(200);
    data = fallback.data;
    fetchError = fallback.error;
  }
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  return NextResponse.json({
    items: data ?? [],
    todayCount: (data ?? []).length,
    store_id: storeId,
    date: day,
    stores,
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const requestType = body.request_type as StoreCustomerRequestType;
  if (requestType !== "order" && requestType !== "price_inquiry") {
    return NextResponse.json({ error: "請選擇服務類型" }, { status: 400 });
  }

  const customerName = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const customerPhone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : "";
  if (!customerName || !customerPhone) {
    return NextResponse.json({ error: "請填寫客戶姓名與電話" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        item: {
          id: crypto.randomUUID(),
          request_type: requestType,
          customer_name: customerName,
          customer_phone: customerPhone,
          status: "pending",
        },
      },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const storeId = await resolveStoreId(admin, typeof body.store_id === "string" ? body.store_id : null);
  if (!storeId) return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });

  const productId = typeof body.product_id === "string" ? body.product_id : null;
  let vendorId = typeof body.vendor_id === "string" ? body.vendor_id : null;
  let unitPrice = body.unit_price != null ? Number(body.unit_price) : null;
  let stockSnapshot = body.stock_snapshot != null ? Number(body.stock_snapshot) : null;
  let barcode = typeof body.barcode === "string" ? body.barcode.trim() || null : null;

  if (productId) {
    const { data: product } = await admin
      .from("products")
      .select("id, barcode, price, stock, supplier_id")
      .eq("id", productId)
      .maybeSingle();
    if (product) {
      barcode = barcode ?? product.barcode ?? null;
      unitPrice = unitPrice ?? (product.price != null ? Number(product.price) : null);
      stockSnapshot =
        stockSnapshot ?? (product.stock != null ? Number(product.stock) : null);
      vendorId = vendorId ?? product.supplier_id ?? null;
    }
  }

  const quantity =
    body.quantity != null && body.quantity !== ""
      ? Number(body.quantity)
      : requestType === "order"
        ? 1
        : null;

  if (requestType === "order" && (!quantity || quantity <= 0)) {
    return NextResponse.json({ error: "請填寫訂購數量" }, { status: 400 });
  }

  const inStock =
    typeof body.in_stock === "boolean"
      ? body.in_stock
      : stockSnapshot != null
        ? stockSnapshot > 0
        : null;

  const payload: Record<string, unknown> = {
    store_id: storeId,
    request_type: requestType,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_source: (body.customer_source as StoreCustomerSource | null) ?? "store",
    product_id: productId,
    barcode,
    vendor_id: vendorId,
    quantity,
    unit_price: unitPrice,
    stock_snapshot: stockSnapshot,
    in_stock: inStock,
    expected_arrival_date:
      typeof body.expected_arrival_date === "string" && body.expected_arrival_date
        ? body.expected_arrival_date
        : null,
    pickup_store_id:
      typeof body.pickup_store_id === "string" && body.pickup_store_id
        ? body.pickup_store_id
        : null,
    inquiry_body:
      typeof body.inquiry_body === "string" ? body.inquiry_body.trim() || null : null,
    needs_reply: body.needs_reply === true,
    note: typeof body.note === "string" ? body.note.trim() || null : null,
    internal_note:
      typeof body.internal_note === "string" ? body.internal_note.trim() || null : null,
    status: "pending" as StoreCustomerRequestStatus,
    assigned_to_name:
      typeof body.assigned_to_name === "string" ? body.assigned_to_name.trim() || null : null,
    follow_up_at:
      typeof body.follow_up_at === "string" && body.follow_up_at ? body.follow_up_at : null,
    created_by: auth!.profile.id,
    created_by_name:
      (auth!.profile as { full_name?: string | null; email?: string | null }).full_name ??
      auth!.profile.email ??
      null,
  };

  let insertResult = await admin
    .from("store_customer_requests")
    .insert(payload)
    .select(
      "*, products(id, name, sku, barcode, supplier_name, price, unit, brands(name)), suppliers(id, name), pickup_store:pickup_store_id(id, name)"
    )
    .single();

  if (insertResult.error && /pickup_store/i.test(insertResult.error.message)) {
    delete payload.pickup_store_id;
    insertResult = await admin
      .from("store_customer_requests")
      .insert(payload)
      .select(
        "*, products(id, name, sku, barcode, supplier_name, price, unit, brands(name)), suppliers(id, name)"
      )
      .single();
  }

  const { data, error: insertError } = insertResult;
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "create",
    "store_customer_requests",
    data.id,
    null,
    data,
    request as never
  );
  return NextResponse.json({ item: data, message: "服務紀錄已建立" }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, ...body } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_customer_requests").select("*").eq("id", id).single();

  const updates: Record<string, unknown> = {};
  for (const key of [
    "status",
    "note",
    "internal_note",
    "assigned_to_name",
    "follow_up_at",
    "needs_reply",
    "track_notified",
    "track_paid",
    "track_picked_up",
    "track_done",
    "inquiry_body",
    "quantity",
    "expected_arrival_date",
    "pickup_store_id",
  ]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Keep track flags in sync when advancing pipeline statuses
  if (updates.status === "notified") updates.track_notified = true;
  if (updates.status === "done") {
    updates.track_done = true;
    updates.track_notified = true;
  }
  if (updates.track_done === true && updates.status === undefined) {
    updates.status = "done";
  }
  if (updates.track_notified === true && updates.status === undefined) {
    updates.status = "notified";
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  let updateResult = await admin
    .from("store_customer_requests")
    .update(updates)
    .eq("id", id)
    .select(
      "*, products(id, name, sku, barcode, supplier_name, price, unit, brands(name)), suppliers(id, name), pickup_store:pickup_store_id(id, name)"
    )
    .single();

  if (updateResult.error && /pickup_store/i.test(updateResult.error.message)) {
    delete updates.pickup_store_id;
    updateResult = await admin
      .from("store_customer_requests")
      .update(updates)
      .eq("id", id)
      .select(
        "*, products(id, name, sku, barcode, supplier_name, price, unit, brands(name)), suppliers(id, name)"
      )
      .single();
  }

  const { data, error: updateError } = updateResult;
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "update",
    "store_customer_requests",
    id,
    old,
    data,
    request as never
  );
  return NextResponse.json({ item: data });
}
