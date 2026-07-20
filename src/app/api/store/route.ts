import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

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

const WITH_PRODUCT: Resource[] = ["inventory", "batches", "reservations", "returns", "disposals"];

function getResource(url: string): Resource {
  const r = new URL(url).searchParams.get("resource") ?? "inventory";
  if (r in TABLE || r === "export") return r as Resource;
  return "inventory";
}

export async function GET(request: Request) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  const resource = getResource(request.url);
  const storeId = new URL(request.url).searchParams.get("store_id");

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
    ? "*, products(id, name, sku, barcode)"
    : "*";
  const orderCol = resource === "inventory" ? "updated_at" : "created_at";

  let query = admin.from(table).select(select).order(orderCol, { ascending: false }).limit(200);
  if (storeId) query = query.eq("store_id", storeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [], resource });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireStaffOrAdmin();
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

  if (resource === "anomalies") payload.reported_by = auth!.profile.id;
  if (resource === "returns" || resource === "disposals") {
    payload.created_by = auth!.profile.id;
  }

  const { data, error } = await admin.from(table).insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "create", table, data.id, null, data, request as never);
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireStaffOrAdmin();
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
