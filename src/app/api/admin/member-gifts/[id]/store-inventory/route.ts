import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeAvailableQuantity } from "@/lib/gifts/inventory";

export const dynamic = "force-dynamic";

type StoreInvInput = {
  store_id: string;
  allocated_quantity: number;
  low_stock_threshold?: number | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireGiftMarketing();
  if (error) return error;
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ inventory: [], stores: [] });
  }

  const admin = createAdminClient();
  const [{ data: inventory }, { data: stores }] = await Promise.all([
    admin
      .from("gift_campaign_store_inventory")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true }),
    admin.from("stores").select("id, name, is_active").order("name"),
  ]);

  const nameMap = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const rows = (inventory ?? []).map((row) => ({
    ...row,
    store_name: nameMap.get(row.store_id) ?? row.store_id,
    remaining: storeAvailableQuantity(row),
  }));

  return NextResponse.json({ inventory: rows, stores: stores ?? [] });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireGiftMarketing();
  if (error) return error;
  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  const rows = Array.isArray(body?.inventory) ? (body.inventory as StoreInvInput[]) : null;
  if (!rows) {
    return NextResponse.json({ error: "請提供 inventory 陣列" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ inventory: rows });
  }

  const admin = createAdminClient();
  const upserts = rows
    .filter((r) => r.store_id && Number(r.allocated_quantity) >= 0)
    .map((r) => ({
      campaign_id: id,
      store_id: r.store_id,
      allocated_quantity: Math.max(0, Math.floor(Number(r.allocated_quantity) || 0)),
      low_stock_threshold:
        r.low_stock_threshold === undefined || r.low_stock_threshold === null
          ? 10
          : Math.max(0, Math.floor(Number(r.low_stock_threshold))),
      updated_at: new Date().toISOString(),
    }));

  if (upserts.length) {
    const { error: uErr } = await admin.from("gift_campaign_store_inventory").upsert(upserts, {
      onConflict: "campaign_id,store_id",
    });
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });
  }

  // Remove stores not in payload when replace=true
  if (body?.replace === true) {
    const keep = upserts.map((u) => u.store_id);
    const { data: existing } = await admin
      .from("gift_campaign_store_inventory")
      .select("id, store_id, reserved_quantity, redeemed_quantity")
      .eq("campaign_id", id);
    const toDelete = (existing ?? []).filter(
      (e) =>
        !keep.includes(e.store_id) &&
        Number(e.reserved_quantity) === 0 &&
        Number(e.redeemed_quantity) === 0
    );
    if (toDelete.length) {
      await admin
        .from("gift_campaign_store_inventory")
        .delete()
        .in(
          "id",
          toDelete.map((d) => d.id)
        );
    }
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "gift_campaign_store_inventory",
    id,
    null,
    { count: upserts.length },
    request as never
  );

  const { data: inventory } = await admin
    .from("gift_campaign_store_inventory")
    .select("*")
    .eq("campaign_id", id);

  return NextResponse.json({ inventory: inventory ?? [] });
}
