import { NextResponse } from "next/server";
import { requireGiftReverseExecute } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { runMemberGiftMaintenance } from "@/lib/gifts/maintenance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/member-gifts/maintenance
 * 總管理員手動執行會員禮維運（過期、狀態同步、低庫存、到期提醒、自動發券）
 */
export async function POST() {
  const { error } = await requireGiftReverseExecute();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "supabase_not_configured",
    });
  }

  const result = await runMemberGiftMaintenance();
  return NextResponse.json({
    ok: true,
    ...result,
    ran_at: new Date().toISOString(),
  });
}
