import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { seedDemoMemberGifts } from "@/lib/gifts/seed-demo";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/member-gifts/seed-demo
 * 建立示範活動（本月會員禮＋門市滿額贈＋生日禮），方便驗收。
 */
export async function POST(request: Request) {
  const { error, auth } = await requireGiftMarketing();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, created: [] });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const result = await seedDemoMemberGifts({
      publish: body?.publish !== false,
      actorId: auth!.profile.id,
    });

    await logAudit(
      auth!.profile.id,
      "seed_demo",
      "gift_campaign",
      null,
      null,
      {
        created: result.created,
        skipped: result.skipped,
        status: result.status,
      },
      request as never
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "建立失敗" },
      { status: 400 }
    );
  }
}
