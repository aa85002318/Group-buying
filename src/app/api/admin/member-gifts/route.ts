import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import type { GiftCampaign } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaigns: [] });
  }

  const admin = createAdminClient();
  const { data, error: qErr } = await admin
    .from("gift_campaigns")
    .select("*")
    .order("updated_at", { ascending: false });
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const campaigns = ((data ?? []) as GiftCampaign[]).map((c) => ({
    ...c,
    available_quantity: availableQuantity(c),
  }));

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效內容" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaign: { id: "mock", ...body } }, { status: 201 });
  }

  const admin = createAdminClient();
  const payload = {
    campaign_type: body.campaign_type === "store_spend_gift" ? "store_spend_gift" : "monthly_member_gift",
    campaign_month: body.campaign_month ?? null,
    name: String(body.name ?? "").trim() || "未命名活動",
    gift_name: String(body.gift_name ?? "").trim() || "禮品",
    gift_image_url: body.gift_image_url ?? null,
    description: body.description ?? null,
    terms: body.terms ?? null,
    notes: body.notes ?? null,
    tag_label: body.tag_label ?? null,
    eligibility_type: body.eligibility_type ?? "all_members",
    minimum_spend: body.minimum_spend ?? null,
    total_quantity: Number(body.total_quantity ?? 0),
    per_member_limit: Number(body.per_member_limit ?? 1),
    per_order_quantity: Number(body.per_order_quantity ?? 1),
    is_stackable: Boolean(body.is_stackable),
    stack_limit: body.stack_limit ?? null,
    inventory_reservation_mode: body.inventory_reservation_mode ?? "reserve_on_claim",
    applicable_redemption_store_ids: body.applicable_redemption_store_ids ?? [],
    applicable_purchase_store_ids: body.applicable_purchase_store_ids ?? [],
    require_same_store_redeem: Boolean(body.require_same_store_redeem),
    claim_start_at: body.claim_start_at ?? null,
    claim_end_at: body.claim_end_at ?? null,
    redeem_start_at: body.redeem_start_at ?? null,
    redeem_end_at: body.redeem_end_at ?? null,
    display_start_at: body.display_start_at ?? null,
    show_remaining_quantity: body.show_remaining_quantity !== false,
    low_stock_threshold: body.low_stock_threshold ?? 10,
    status: body.status ?? "draft",
    created_by: auth!.profile.id,
    updated_by: auth!.profile.id,
  };

  const { data, error: iErr } = await admin
    .from("gift_campaigns")
    .insert(payload)
    .select("*")
    .single();

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });

  await logAudit(
    auth!.profile.id,
    "create",
    "gift_campaign",
    data.id,
    null,
    { name: data.name, campaign_type: data.campaign_type },
    request as never
  );

  return NextResponse.json({ campaign: data }, { status: 201 });
}
