import { NextResponse } from "next/server";
import { requireGiftRedeem } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";
import { maskMemberName, memberNumberTail } from "@/lib/gifts/status";

export const dynamic = "force-dynamic";

/** 門市人工查詢：電話或會員編號 → 可核銷兌換券列表 */
export async function POST(request: Request) {
  const { error, auth } = await requireGiftRedeem();
  if (error) return error;

  if (auth!.profile.role === "customer_service" || auth!.profile.role === "content_editor") {
    return NextResponse.json({ error: "此帳號不可查詢核銷" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const phone = String(body?.phone ?? "").replace(/\D/g, "");
  const memberNumber = String(body?.member_number ?? body?.member_code ?? "").trim();
  const q = String(body?.q ?? "").trim();

  if (!phone && !memberNumber && !q) {
    return NextResponse.json({ error: "請輸入電話或會員編號" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      member: { name_masked: "王＊", member_tail: "0001" },
      claims: [
        {
          id: "mock-claim-1",
          status: "available",
          gift_name: "示範贈品",
          redemption_code: "MGDEMO1234",
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
    });
  }

  const storeId = await getStaffStoreId(auth!.profile.id);
  if (!storeId && auth!.profile.role !== "admin") {
    return NextResponse.json({ error: "尚未綁定門市，無法核銷" }, { status: 403 });
  }

  const admin = createAdminClient();
  let profileQuery = admin
    .from("profiles")
    .select("id, full_name, member_number, member_code, phone")
    .limit(5);

  if (phone) {
    profileQuery = profileQuery.or(`phone.eq.${phone},phone.ilike.%${phone.slice(-9)}`);
  } else if (memberNumber) {
    profileQuery = profileQuery.or(
      `member_number.eq.${memberNumber},member_code.eq.${memberNumber}`
    );
  } else if (q) {
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 8) {
      profileQuery = profileQuery.or(`phone.eq.${digits},phone.ilike.%${digits.slice(-9)}`);
    } else {
      profileQuery = profileQuery.or(`member_number.eq.${q},member_code.eq.${q}`);
    }
  }

  const { data: profiles, error: pErr } = await profileQuery;
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!profiles?.length) {
    return NextResponse.json({ error: "找不到會員", claims: [] }, { status: 404 });
  }
  if (profiles.length > 1) {
    return NextResponse.json(
      {
        error: "找到多位會員，請輸入更完整的電話或會員編號",
        candidates: profiles.map((p) => ({
          id: p.id,
          name_masked: maskMemberName(p.full_name),
          member_tail: memberNumberTail(p.member_number ?? p.member_code),
        })),
      },
      { status: 409 }
    );
  }

  const member = profiles[0];
  const { data: claims, error: cErr } = await admin
    .from("member_gift_claims")
    .select(
      "id, status, quantity, expires_at, redemption_code, gift_item_id, gift_campaigns(name, gift_name, gift_image_url, applicable_redemption_store_ids, item_selection_mode), gift_campaign_items(gift_name)"
    )
    .eq("member_id", member.id)
    .eq("status", "available")
    .order("claimed_at", { ascending: false })
    .limit(20);

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const rows = (claims ?? [])
    .map((claim) => {
      const campaign = claim.gift_campaigns as {
        name?: string;
        gift_name?: string;
        gift_image_url?: string | null;
        applicable_redemption_store_ids?: string[];
        item_selection_mode?: string;
      } | null;
      const item = claim.gift_campaign_items as { gift_name?: string } | null;
      const allowedIds = campaign?.applicable_redemption_store_ids ?? [];
      const allowed =
        !storeId || allowedIds.length === 0 || allowedIds.includes(storeId);
      return {
        id: claim.id,
        status: claim.status,
        quantity: claim.quantity,
        expires_at: claim.expires_at,
        redemption_code: claim.redemption_code,
        gift_item_id: claim.gift_item_id,
        gift_name: item?.gift_name || campaign?.gift_name || "會員禮",
        campaign_name: campaign?.name,
        gift_image_url: campaign?.gift_image_url ?? null,
        item_selection_mode: campaign?.item_selection_mode ?? "single",
        store_allowed: allowed,
      };
    })
    .filter((c) => c.store_allowed);

  return NextResponse.json({
    member: {
      id: member.id,
      name_masked: maskMemberName(member.full_name),
      member_tail: memberNumberTail(member.member_number ?? member.member_code),
    },
    claims: rows,
  });
}
