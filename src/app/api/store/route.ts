import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysFromNow, todayISO } from "@/lib/admin/store-ops";

type Resource =
  | "inventory"
  | "batches"
  | "anomalies"
  | "returns"
  | "disposals"
  | "reservations"
  | "announcements"
  | "export";

const TABLE: Record<Exclude<Resource, "export">, string> = {
  inventory: "store_inventory",
  batches: "store_batches",
  anomalies: "store_anomalies",
  returns: "store_returns",
  disposals: "store_disposals",
  reservations: "store_reservations",
  announcements: "store_announcements",
};

const WITH_PRODUCT: Resource[] = [
  "inventory",
  "batches",
  "reservations",
  "returns",
  "disposals",
  "anomalies",
];

function getResource(url: string): Resource {
  const r = new URL(url).searchParams.get("resource") ?? "inventory";
  if (r in TABLE || r === "export") return r as Resource;
  return "inventory";
}

export async function GET(request: Request) {
  const { error: authError } = await requireStoreOps();
  if (authError) return authError;

  const resource = getResource(request.url);
  const url = new URL(request.url);
  const storeId = url.searchParams.get("store_id");
  const range = url.searchParams.get("range");
  const status = url.searchParams.get("status");
  const low = url.searchParams.get("low");
  const q = url.searchParams.get("q")?.trim();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [], resource });
  }

  const admin = createAdminClient();

  if (resource === "export") {
    const [{ data: inventory }, { data: batches }] = await Promise.all([
      admin.from("store_inventory").select("*, products(id, name, sku, barcode)"),
      admin.from("store_batches").select("*, products(id, name, sku)").order("expiry_date"),
    ]);
    return NextResponse.json({
      export: {
        inventory: inventory ?? [],
        batches: batches ?? [],
        exported_at: new Date().toISOString(),
      },
    });
  }

  const table = TABLE[resource];
  const select = WITH_PRODUCT.includes(resource)
    ? "*, products(id, name, sku, barcode, image_url, supplier_name, safety_stock, stock)"
    : "*";
  const orderCol =
    resource === "inventory"
      ? "updated_at"
      : resource === "batches"
        ? "expiry_date"
        : "created_at";

  let query = admin
    .from(table)
    .select(select)
    .order(orderCol, { ascending: resource === "batches" })
    .limit(300);

  if (storeId) query = query.eq("store_id", storeId);
  if (status) {
    if (status.includes(",")) query = query.in("status", status.split(","));
    else query = query.eq("status", status);
  }

  if (resource === "batches" && range) {
    const today = todayISO();
    if (range === "expired") {
      query = query.lt("expiry_date", today).eq("status", "active");
    } else {
      const days = Number(range);
      if (!Number.isNaN(days) && days > 0) {
        query = query
          .gte("expiry_date", today)
          .lte("expiry_date", daysFromNow(days))
          .eq("status", "active");
      }
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type StoreRow = {
    quantity?: number | null;
    batch_no?: string | null;
    products?: {
      name?: string;
      sku?: string;
      barcode?: string;
      stock?: number;
      safety_stock?: number;
    } | null;
  };

  let items = (data ?? []) as StoreRow[];
  if (resource === "inventory" && low === "1") {
    items = items.filter((item) => {
      const product = item.products;
      const stock = Number(product?.stock ?? item.quantity ?? 0);
      const safety = Number(product?.safety_stock ?? 0);
      return safety > 0 ? stock < safety : stock <= 5;
    });
  }
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((item) => {
      const product = item.products;
      return (
        product?.name?.toLowerCase().includes(needle) ||
        product?.sku?.toLowerCase().includes(needle) ||
        product?.barcode?.toLowerCase().includes(needle) ||
        String(item.batch_no ?? "").toLowerCase().includes(needle)
      );
    });
  }

  return NextResponse.json({ items, resource });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireStoreOps();
  if (authError) return authError;

  const body = await request.json();
  const resource = (body.resource as Resource) ?? getResource(request.url);
  if (resource === "export" || !(resource in TABLE)) {
    return NextResponse.json({ error: "無效 resource" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id: `tmp-${Date.now()}`, ...body } }, { status: 201 });
  }

  const admin = createAdminClient();
  const table = TABLE[resource];
  const payload = { ...body };
  delete payload.resource;

  if (!payload.store_id) {
    const { data: store } = await admin
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (store?.id) payload.store_id = store.id;
  }

  if (resource === "anomalies") {
    payload.reported_by = auth!.profile.id;
    payload.reported_at = payload.reported_at ?? new Date().toISOString();
  }
  if (resource === "returns" || resource === "disposals") {
    payload.created_by = auth!.profile.id;
  }
  if (resource === "batches") {
    payload.created_by = auth!.profile.id;
    if (payload.quantity != null && payload.remaining_quantity == null) {
      payload.remaining_quantity = payload.quantity;
    }
    payload.status = payload.status ?? "active";
    payload.batch_no = payload.batch_no || `B${Date.now()}`;
  }
  if (resource === "disposals") {
    payload.disposed_at = payload.disposed_at ?? new Date().toISOString();
    if (payload.unit_cost != null && payload.quantity != null && payload.total_loss == null) {
      payload.total_loss = Number(payload.unit_cost) * Number(payload.quantity);
    }
  }

  // Store Ops V2: disposals / returns / anomalies must reference a batch
  if (
    (resource === "disposals" || resource === "returns" || resource === "anomalies") &&
    !payload.batch_id
  ) {
    return NextResponse.json(
      { error: "請選擇批次（batch_id）。門市作業以批次為核心，不可只指定商品。" },
      { status: 400 }
    );
  }

  const { data, error } = await admin.from(table).insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort inventory movement + batch remaining for disposals/returns
  try {
    const { recordInventoryMovement, syncInventoryFromBatches } = await import(
      "@/lib/admin/inventory-movements"
    );
    if (resource === "batches" && payload.store_id && payload.product_id) {
      await recordInventoryMovement({
        storeId: String(payload.store_id),
        productId: String(payload.product_id),
        batchId: data.id,
        movementType: "receive",
        quantityDelta: Number(payload.quantity ?? 0),
        quantityBefore: 0,
        quantityAfter: Number(payload.quantity ?? 0),
        createdBy: auth!.profile.id,
      });
      await syncInventoryFromBatches(String(payload.store_id), String(payload.product_id));
    }
    if (
      (resource === "disposals" || resource === "returns") &&
      payload.batch_id &&
      payload.store_id &&
      payload.product_id
    ) {
      const qty = Number(payload.quantity ?? 0);
      const { data: batch } = await admin
        .from("store_batches")
        .select("remaining_quantity, quantity, store_id, product_id")
        .eq("id", payload.batch_id)
        .single();
      if (batch) {
        const before = Number(batch.remaining_quantity ?? batch.quantity ?? 0);
        const after = Math.max(0, before - qty);
        await admin
          .from("store_batches")
          .update({ remaining_quantity: after })
          .eq("id", payload.batch_id);
        await recordInventoryMovement({
          storeId: String(payload.store_id),
          productId: String(payload.product_id),
          batchId: String(payload.batch_id),
          movementType: resource === "disposals" ? "disposal" : "return",
          quantityDelta: -qty,
          quantityBefore: before,
          quantityAfter: after,
          referenceType: table,
          referenceId: data.id,
          createdBy: auth!.profile.id,
        });
        await syncInventoryFromBatches(String(payload.store_id), String(payload.product_id));
      }
    }
  } catch (e) {
    console.error("[store POST movement]", e);
  }

  await logAudit(auth!.profile.id, "create", table, data.id, null, data, request as never);
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireStoreOps();
  if (authError) return authError;

  const body = await request.json();
  const resource = body.resource as Resource;
  const { id, ...rest } = body;
  delete rest.resource;

  if (!id || !resource || resource === "export" || !(resource in TABLE)) {
    return NextResponse.json({ error: "缺少 id / resource" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, ...rest } });
  }

  const admin = createAdminClient();
  const table = TABLE[resource];
  const { data: old } = await admin.from(table).select("*").eq("id", id).single();
  const { data, error } = await admin.from(table).update(rest).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", table, id, old, data, request as never);
  return NextResponse.json({ item: data });
}
