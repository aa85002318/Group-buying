import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import type { GiftCampaign } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaign: null, claims: [], logs: [] });
  }

  const admin = createAdminClient();
  const { data: campaign, error: cErr } = await admin
    .from("gift_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!campaign) return NextResponse.json({ error: "找不到活動" }, { status: 404 });

  const [{ data: claims }, { data: logs }] = await Promise.all([
    admin
      .from("member_gift_claims")
      .select("*, profiles:member_id(full_name, phone, member_number)")
      .eq("campaign_id", id)
      .order("claimed_at", { ascending: false })
      .limit(200),
    admin
      .from("gift_redemption_logs")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return NextResponse.json({
    campaign: {
      ...(campaign as GiftCampaign),
      available_quantity: availableQuantity(campaign as GiftCampaign),
    },
    claims: claims ?? [],
    logs: logs ?? [],
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效內容" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaign: { id, ...body } });
  }

  const admin = createAdminClient();
  const allowed = [
    "name",
    "gift_name",
    "gift_image_url",
    "description",
    "terms",
    "notes",
    "tag_label",
    "campaign_month",
    "eligibility_type",
    "minimum_spend",
    "total_quantity",
    "per_member_limit",
    "per_order_quantity",
    "is_stackable",
    "stack_limit",
    "inventory_reservation_mode",
    "applicable_redemption_store_ids",
    "applicable_purchase_store_ids",
    "require_same_store_redeem",
    "claim_start_at",
    "claim_end_at",
    "redeem_start_at",
    "redeem_end_at",
    "display_start_at",
    "show_remaining_quantity",
    "low_stock_threshold",
    "status",
  ] as const;

  const patch: Record<string, unknown> = { updated_by: auth!.profile.id };
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const { data, error: uErr } = await admin
    .from("gift_campaigns")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

  await logAudit(
    auth!.profile.id,
    "update",
    "gift_campaign",
    id,
    null,
    patch,
    request as never
  );

  return NextResponse.json({ campaign: data });
}
