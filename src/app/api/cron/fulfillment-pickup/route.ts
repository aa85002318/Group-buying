import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { runFulfillmentPickupJobs } from "@/lib/fulfillment/jobs";

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

async function handle(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "supabase_not_configured" });
  }

  const result = await runFulfillmentPickupJobs();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
