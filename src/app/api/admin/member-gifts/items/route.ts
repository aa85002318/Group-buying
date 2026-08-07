import { NextResponse } from "next/server";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireGiftMarketing();
  if (error) return error;

  const campaignId = new URL(request.url).searchParams.get("campaign_id");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] });
  }

  const admin = createAdminClient();
  let q = admin
    .from("gift_campaign_items")
    .select("*, gift_campaigns(name, campaign_code, item_selection_mode)")
    .order("sort_order", { ascending: true })
    .limit(500);
  if (campaignId) q = q.eq("campaign_id", campaignId);

  const { data, error: qErr } = await q;
  if (qErr) {
    return NextResponse.json({ items: [], warning: qErr.message });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireGiftMarketing();
  if (error) return error;
  void auth;

  const body = await request.json().catch(() => null);
  if (!body?.campaign_id || !body?.gift_name) {
    return NextResponse.json({ error: "缺少活動或贈品名稱" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id: "mock", ...body } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: iErr } = await admin
    .from("gift_campaign_items")
    .insert({
      campaign_id: body.campaign_id,
      gift_name: String(body.gift_name).trim(),
      gift_image_url: body.gift_image_url ?? null,
      gift_code: body.gift_code ?? null,
      product_sku: body.product_sku ?? null,
      description: body.description ?? null,
      quantity_per_redeem: Number(body.quantity_per_redeem ?? 1),
      cost_amount: body.cost_amount ?? null,
      total_quantity: body.total_quantity === "" || body.total_quantity == null
        ? null
        : Number(body.total_quantity),
      requires_store_prep: body.requires_store_prep !== false,
      requires_variant: Boolean(body.requires_variant),
      allow_substitute_when_oos: Boolean(body.allow_substitute_when_oos),
      substitute_item_id: body.substitute_item_id || null,
      sort_order: Number(body.sort_order ?? 0),
      is_active: body.is_active !== false,
    })
    .select("*")
    .single();

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { error } = await requireGiftMarketing();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少品項 ID" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: body });
  }

  const allowed = [
    "gift_name",
    "gift_image_url",
    "gift_code",
    "product_sku",
    "description",
    "quantity_per_redeem",
    "cost_amount",
    "total_quantity",
    "requires_store_prep",
    "requires_variant",
    "allow_substitute_when_oos",
    "substitute_item_id",
    "sort_order",
    "is_active",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const admin = createAdminClient();
  const { data, error: uErr } = await admin
    .from("gift_campaign_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const { error } = await requireGiftMarketing();
  if (error) return error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少品項 ID" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: dErr } = await admin.from("gift_campaign_items").delete().eq("id", id);
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
