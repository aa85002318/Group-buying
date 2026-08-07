import { createAdminClient } from "@/lib/supabase/admin";

export type SeedDemoResult = {
  created: Array<{ id: string; name: string; campaign_type: string }>;
  skipped: string[];
  status: "published" | "draft";
  stores: Array<{ id: string; name: string }>;
  month: string;
};

/** 建立本月示範活動（冪等：同 campaign_code 已存在則略過） */
export async function seedDemoMemberGifts(opts?: {
  publish?: boolean;
  actorId?: string | null;
}): Promise<SeedDemoResult> {
  const publish = opts?.publish !== false;
  const status = publish ? "published" : "draft";
  const actorId = opts?.actorId ?? null;

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
  const storeRows = (stores ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
  }));

  const created: SeedDemoResult["created"] = [];
  const skipped: string[] = [];

  async function ensureCampaign(cfg: {
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
      .eq("campaign_code", cfg.code)
      .maybeSingle();
    if (existing) {
      skipped.push(cfg.code);
      return;
    }

    const payload: Record<string, unknown> = {
      campaign_type: cfg.type,
      campaign_code: cfg.code,
      campaign_month: month,
      name: cfg.name,
      gift_name: cfg.giftName,
      gift_image_url: null,
      description: cfg.description,
      terms: cfg.terms,
      notes: "示範活動，可於後台編輯後正式使用。",
      tag_label: cfg.tag,
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
      item_selection_mode: "single",
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
      ...cfg.extra,
    };
    if (actorId) {
      payload.created_by = actorId;
      payload.updated_by = actorId;
    }

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
      gift_name: cfg.giftName,
      quantity_per_redeem: 1,
      sort_order: 0,
      is_active: true,
      total_quantity: 100,
      reserved_quantity: 0,
      redeemed_quantity: 0,
    });
  }

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

  return { created, skipped, status, stores: storeRows, month };
}
