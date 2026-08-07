import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftReverseExecute } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimMonthlyGift } from "@/lib/gifts/service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/member-gifts/claims/reissue
 * 總管理員補發兌換券（可略過資格與個人上限，仍扣庫存）
 */
export async function POST(request: Request) {
  const { error, auth } = await requireGiftReverseExecute();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const campaignId = String(body?.campaign_id ?? "").trim();
  const memberId = String(body?.member_id ?? "").trim();
  const reason = String(body?.reason ?? "").trim();
  const designatedStoreId =
    String(body?.store_id ?? body?.designated_store_id ?? "").trim() || null;
  const giftItemId = String(body?.gift_item_id ?? "").trim() || null;

  if (!campaignId || !memberId) {
    return NextResponse.json({ error: "請指定活動與會員" }, { status: 400 });
  }
  if (reason.length < 2) {
    return NextResponse.json({ error: "請填寫補發原因" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      claim: { id: "mock-reissue", campaign_id: campaignId, member_id: memberId },
    });
  }

  const admin = createAdminClient();
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select(
      "id, created_at, birthday, member_level, member_tags, phone, email, member_points"
    )
    .eq("id", memberId)
    .maybeSingle();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "找不到會員" }, { status: 404 });

  const result = await claimMonthlyGift({
    campaignId,
    memberId,
    designatedStoreId,
    giftItemId,
    profile: {
      id: profile.id,
      created_at: profile.created_at,
      birthday: profile.birthday,
      member_level: profile.member_level,
      member_tags: profile.member_tags,
      phone: profile.phone,
      email: profile.email,
      member_points: profile.member_points,
    },
    adminOverride: {
      reason,
      bypassEligibility: true,
      bypassMemberLimit: true,
    },
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  await logAudit(
    auth!.profile.id,
    "admin_reissue",
    "member_gift_claim",
    result.claim.id,
    null,
    { campaign_id: campaignId, member_id: memberId, reason },
    request as never
  );

  return NextResponse.json(
    { claim: result.claim, message: "已補發兌換券" },
    { status: 201 }
  );
}
