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
      },
    });
  }

  const result = await claimMonthlyGift({
    campaignId,
    memberId: auth!.profile.id,
    profile: {
      id: auth!.profile.id,
      created_at: (auth!.profile as { created_at?: string }).created_at ?? null,
      birthday: (auth!.profile as { birthday?: string }).birthday ?? null,
      member_level: (auth!.profile as { member_level?: string }).member_level ?? null,
    },
  });

  if ("error" in result) {
    const status =
      result.code === "exhausted" || result.code === "limit_reached" || result.code === "already_claimed"
        ? 409
        : result.code === "ineligible"
          ? 403
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ claim: result.claim }, { status: 201 });
}
