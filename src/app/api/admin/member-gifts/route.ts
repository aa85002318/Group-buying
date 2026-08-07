import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import type { GiftCampaign, GiftCampaignType } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

const CAMPAIGN_TYPES: GiftCampaignType[] = [
  "monthly_member_gift",
  "store_spend_gift",
  "targeted_member_gift",
  "birthday_gift",
  "new_member_gift",
  "event_limited_gift",
];

function normalizeType(raw: unknown): GiftCampaignType {
  const v = String(raw ?? "");
  return CAMPAIGN_TYPES.includes(v as GiftCampaignType)
    ? (v as GiftCampaignType)
    : "monthly_member_gift";
}

function generateCode() {
  return `MG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET() {
  const { error } = await requireGiftMarketing();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaigns: [] });
  }

  const admin = createAdminClient();
  const { data, error: qErr } = await admin
    .from("gift_campaigns")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const campaigns = ((data ?? []) as GiftCampaign[]).map((c) => ({
    ...c,
    available_quantity: availableQuantity(c),
  }));

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const { error, auth } = await requireGiftMarketing();
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
    campaign_type: normalizeType(body.campaign_type),
    campaign_code: String(body.campaign_code ?? "").trim() || generateCode(),
    campaign_month: body.campaign_month ?? null,
    name: String(body.name ?? "").trim() || "未命名活動",
    gift_name: String(body.gift_name ?? "").trim() || "禮品",
    gift_image_url: body.gift_image_url ?? body.list_image_url ?? null,
    list_image_url: body.list_image_url ?? body.gift_image_url ?? null,
    banner_image_url: body.banner_image_url ?? null,
    description: body.description ?? null,
    terms: body.terms ?? null,
    notes: body.notes ?? null,
    tag_label: body.tag_label ?? null,
    eligibility_type: body.eligibility_type ?? "all_members",
    minimum_spend: body.minimum_spend ?? null,
    total_quantity: Number(body.total_quantity ?? 0),
    per_member_limit: Number(body.per_member_limit ?? 1),
    per_order_quantity: Number(body.per_order_quantity ?? 1),
    per_member_daily_limit: body.per_member_daily_limit ?? null,
    is_stackable: Boolean(body.is_stackable),
    stack_limit: body.stack_limit ?? null,
    inventory_reservation_mode: body.inventory_reservation_mode ?? "reserve_on_claim",
    inventory_scope: body.inventory_scope === "per_store" ? "per_store" : "shared",
    applicable_redemption_store_ids: body.applicable_redemption_store_ids ?? [],
    applicable_purchase_store_ids: body.applicable_purchase_store_ids ?? [],
    require_same_store_redeem: Boolean(body.require_same_store_redeem),
    allow_cross_store_redeem: Boolean(body.allow_cross_store_redeem),
    require_store_selection: Boolean(body.require_store_selection),
    item_selection_mode: body.item_selection_mode ?? "single",
    auto_hide_when_sold_out: body.auto_hide_when_sold_out !== false,
    show_on_frontend: body.show_on_frontend !== false,
    sort_order: Number(body.sort_order ?? 0),
    redeem_within_days: body.redeem_within_days ?? null,
    frontend_title: body.frontend_title ?? null,
    frontend_subtitle: body.frontend_subtitle ?? null,
    claim_button_label: body.claim_button_label ?? "立即領取",
    sold_out_label: body.sold_out_label ?? "兌換完畢",
    activity_start_at: body.activity_start_at ?? body.claim_start_at ?? null,
    activity_end_at: body.activity_end_at ?? body.claim_end_at ?? null,
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

  // Seed primary gift item from gift_name
  await admin.from("gift_campaign_items").insert({
    campaign_id: data.id,
    gift_name: data.gift_name,
    gift_image_url: data.gift_image_url,
    quantity_per_redeem: 1,
    sort_order: 0,
  });

  await logAudit(
    auth!.profile.id,
    "create",
    "gift_campaign",
    data.id,
    null,
    { name: data.name, campaign_type: data.campaign_type, campaign_code: data.campaign_code },
    request as never
  );

  return NextResponse.json({ campaign: data }, { status: 201 });
}
