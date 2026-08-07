import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { runMemberGiftMaintenance } from "@/lib/gifts/maintenance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const vercelCron = request.headers.get("x-vercel-cron");

  if (secret) {
    return auth === `Bearer ${secret}`;
  }
  if (vercelCron === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/**
 * GET/POST /api/cron/member-gifts
 * - 過期未兌換券 → expired，並釋放保留庫存
 * - scheduled → published、published → ended（依活動時間）
 */
async function handle(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
