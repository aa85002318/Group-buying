import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { availableQuantity } from "@/lib/gifts/inventory";
import { validateCampaignForPublish } from "@/lib/gifts/publish-check";
import type { GiftCampaign, GiftCampaignItem } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireGiftMarketing();
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

  const [{ data: claims }, { data: logs }, { data: storeInventory }, { data: items }] =
    await Promise.all([
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
      admin.from("gift_campaign_store_inventory").select("*").eq("campaign_id", id),
      admin
        .from("gift_campaign_items")
        .select("*")
        .eq("campaign_id", id)
        .order("sort_order", { ascending: true }),
    ]);

  return NextResponse.json({
    campaign: {
      ...(campaign as GiftCampaign),
      available_quantity: availableQuantity(campaign as GiftCampaign),
    },
    claims: claims ?? [],
    logs: logs ?? [],
    store_inventory: storeInventory ?? [],
    items: items ?? [],
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireGiftMarketing();
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
    "list_image_url",
    "banner_image_url",
    "description",
    "terms",
    "notes",
    "tag_label",
    "campaign_month",
    "campaign_code",
    "campaign_type",
    "eligibility_type",
    "eligible_member_levels",
    "eligible_member_ids",
    "eligible_member_tags",
    "eligibility_min_spend",
    "eligibility_min_points",
    "eligibility_registered_from",
    "eligibility_registered_to",
    "require_phone_verified",
    "require_email_verified",
    "minimum_spend",
    "spend_calculation_type",
    "spend_mode",
    "exclude_shipping",
    "exclude_coupons",
    "exclude_cancelled",
    "exclude_refunded",
    "required_order_statuses",
    "applicable_product_ids",
    "applicable_category_ids",
    "excluded_product_ids",
    "total_quantity",
    "per_member_limit",
    "per_order_quantity",
    "per_member_daily_limit",
    "is_stackable",
    "stack_limit",
    "inventory_reservation_mode",
    "inventory_scope",
    "applicable_redemption_store_ids",
    "applicable_purchase_store_ids",
    "excluded_store_ids",
    "require_same_store_redeem",
    "allow_cross_store_redeem",
    "require_store_selection",
    "item_selection_mode",
    "auto_hide_when_sold_out",
    "show_on_frontend",
    "sort_order",
    "redeem_within_days",
    "allow_repeat_participation",
    "stackable_with_other_gifts",
    "require_self_redeem",
    "frontend_title",
    "frontend_subtitle",
    "claim_button_label",
    "sold_out_label",
    "activity_start_at",
    "activity_end_at",
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

  if (patch.status === "published") {
    const { data: current } = await admin.from("gift_campaigns").select("*").eq("id", id).maybeSingle();
    const merged = { ...(current ?? {}), ...patch, id } as GiftCampaign;
    const { data: items } = await admin
      .from("gift_campaign_items")
      .select("*")
      .eq("campaign_id", id)
      .eq("is_active", true);
    const issues = await validateCampaignForPublish(merged, {
      items: (items ?? []) as GiftCampaignItem[],
    });
    if (issues.length) {
      return NextResponse.json(
        {
          error: issues.map((i) => i.message).join("；"),
          issues,
        },
        { status: 400 }
      );
    }
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
