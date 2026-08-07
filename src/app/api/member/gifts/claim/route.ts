import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { claimMonthlyGift } from "@/lib/gifts/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const campaignId = String(body?.campaign_id ?? "").trim();
  const designatedStoreId = String(body?.store_id ?? body?.designated_store_id ?? "").trim() || null;
  const giftItemId = String(body?.gift_item_id ?? body?.item_id ?? "").trim() || null;
  if (!campaignId) {
    return NextResponse.json({ error: "缺少活動 ID" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      claim: {
        id: "mock-claim-1",
        campaign_id: campaignId,
        status: "available",
        quantity: 1,
        redemption_code: "MGDEMO1234",
        expires_at: new Date(Date.now() + 20 * 86400000).toISOString(),
        designated_store_id: designatedStoreId,
      },
    });
  }

  const profile = auth!.profile as {
    id: string;
    created_at?: string;
    birthday?: string;
    member_level?: string;
    member_tags?: string[];
    phone?: string;
    email?: string;
    member_points?: number;
  };

  const result = await claimMonthlyGift({
    campaignId,
    memberId: auth!.profile.id,
    designatedStoreId,
    giftItemId,
    profile: {
      id: profile.id,
      created_at: profile.created_at ?? null,
      birthday: profile.birthday ?? null,
      member_level: profile.member_level ?? null,
      member_tags: profile.member_tags ?? null,
      phone: profile.phone ?? null,
      email: profile.email ?? null,
      member_points: Number(profile.member_points ?? 0),
    },
  });

  if ("error" in result) {
    const status =
      result.code === "exhausted" ||
      result.code === "limit_reached" ||
      result.code === "already_claimed" ||
      result.code === "daily_limit"
        ? 409
        : result.code === "ineligible"
          ? 403
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ claim: result.claim }, { status: 201 });
}
