import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/member-gifts/seed-demo
 * 建立示範活動（本月會員禮＋門市滿額贈草稿／已發布），方便驗收。
 * 若本月已有同類型 published／draft 示範碼則略過。
 */
export async function POST(request: Request) {
  const { error, auth } = await requireGiftMarketing();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, created: [] });
  }

  const body = await request.json().catch(() => ({}));
  const publish = body?.publish !== false;
  const status = publish ? "published" : "draft";

  const admin = createAdminClient();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const start = new Date(now.getTime() - 86400000).toISOString();
  const claimEnd = new Date(now.getTime() + 25 * 86400000).toISOString();
  const redeemEnd = new Date(now.getTime() + 35 * 86400000).toISOString();

  const { data: stores } = await admin
    .from("stores")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(3);
  const storeIds = (stores ?? []).map((s) => s.id as string);

  const created: Array<{ id: string; name: string; campaign_type: string }> = [];
  const skipped: string[] = [];

  async function ensureCampaign(opts: {
    code: string;
    type: string;
    name: string;
    giftName: string;
    description: string;
    terms: string;
    tag: string;
    extra?: Record<string, unknown>;
  }) {
    const { data: existing } = await admin
      .from("gift_campaigns")
      .select("id, name, status")
      .eq("campaign_code", opts.code)
      .maybeSingle();
    if (existing) {
      skipped.push(opts.code);
      return;
    }

    const payload = {
      campaign_type: opts.type,
      campaign_code: opts.code,
      campaign_month: month,
      name: opts.name,
      gift_name: opts.giftName,
      gift_image_url: null,
      description: opts.description,
      terms: opts.terms,
      notes: "示範活動，可於後台編輯後正式使用。",
      tag_label: opts.tag,
      eligibility_type: "all_members",
      eligible_member_levels: [],
      eligible_member_ids: [],
      total_quantity: 100,
      reserved_quantity: 0,
      redeemed_quantity: 0,
      per_member_limit: 1,
      per_order_quantity: 1,
      is_stackable: false,
      inventory_reservation_mode: "reserve_on_claim",
      inventory_scope: "shared",
      applicable_redemption_store_ids: storeIds,
      require_same_store_redeem: false,
      require_store_selection: false,
      show_on_frontend: true,
      show_remaining_quantity: true,
      low_stock_threshold: 10,
      claim_button_label: "立即領取",
      sold_out_label: "本月會員禮已兌換完畢",
      display_start_at: start,
      claim_start_at: start,
      claim_end_at: claimEnd,
      redeem_start_at: start,
      redeem_end_at: redeemEnd,
      status,
      created_by: auth!.profile.id,
      updated_by: auth!.profile.id,
      ...opts.extra,
    };

    const { data, error: iErr } = await admin
      .from("gift_campaigns")
      .insert(payload)
      .select("id, name, campaign_type")
      .single();
    if (iErr) throw new Error(iErr.message);
    created.push({
      id: data.id,
      name: data.name,
      campaign_type: data.campaign_type,
    });

    await admin.from("gift_campaign_items").insert({
      campaign_id: data.id,
      gift_name: opts.giftName,
      quantity_per_redeem: 1,
      sort_order: 0,
      is_active: true,
      total_quantity: 100,
      reserved_quantity: 0,
      redeemed_quantity: 0,
    });
  }

  try {
    await ensureCampaign({
      code: `DEMO-MONTHLY-${month}`,
      type: "monthly_member_gift",
      name: `${month} 示範本月會員禮`,
      giftName: "CHIMEIDIY 限定烘焙材料包",
      description: "每月精選會員專屬好禮，數量有限，換完為止",
      terms: "一般會員即可兌換，每位限領 1 份。",
      tag: "本月會員禮",
    });

    await ensureCampaign({
      code: `DEMO-SPEND-${month}`,
      type: "store_spend_gift",
      name: `${month} 示範門市滿額贈`,
      giftName: "烘焙刮刀",
      description: "門市消費達門檻即可獲贈",
      terms: "單筆實付滿 NT$1,000，每筆訂單限領 1 份。",
      tag: "門市滿額贈",
      extra: {
        eligibility_type: "spend_threshold",
        minimum_spend: 1000,
        eligibility_min_spend: 1000,
        spend_calculation_type: "paid_ex_shipping",
        exclude_shipping: true,
        exclude_coupons: false,
        exclude_cancelled: true,
        exclude_refunded: true,
        required_order_statuses: ["completed"],
        applicable_purchase_store_ids: storeIds,
        claim_button_label: null,
        sold_out_label: "滿額贈已額滿",
      },
    });

    await ensureCampaign({
      code: `DEMO-BDAY-${month}`,
      type: "birthday_gift",
      name: `${month} 示範生日禮`,
      giftName: "生日小禮物",
      description: "當月壽星專屬",
      terms: "當月生日會員可領取。",
      tag: "生日禮",
      extra: {
        eligibility_type: "birthday_month",
        claim_button_label: "領取生日禮",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "建立失敗", created, skipped },
      { status: 400 }
    );
  }

  await logAudit(
    auth!.profile.id,
    "seed_demo",
    "gift_campaign",
    null,
    null,
    { created, skipped, status },
    request as never
  );

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    status,
    stores: (stores ?? []).map((s) => ({ id: s.id, name: s.name })),
  });
}
