import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { publishAllDueCmsSchedules } from "@/lib/cms/publish-due";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const vercelCron = request.headers.get("x-vercel-cron");

  if (secret) {
    return auth === `Bearer ${secret}`;
  }

  // Vercel Cron injects this header when CRON_SECRET is unset
  if (vercelCron === "1") return true;

  // Local / staging without secret: allow in non-production only
  return process.env.NODE_ENV !== "production";
}

/**
 * GET/POST /api/cron/cms-publish
 * Applies due homepage + group-buy CMS schedules.
 * Secure with CRON_SECRET (Authorization: Bearer …) or Vercel Cron.
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
      home: false,
      groupBuy: false,
      errors: [],
    });
  }

  const result = await publishAllDueCmsSchedules();
  const publishedAny = result.home || result.groupBuy;

  return NextResponse.json({
    ok: result.errors.length === 0,
    publishedAny,
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
