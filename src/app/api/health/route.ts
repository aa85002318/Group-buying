import { NextResponse } from "next/server";

/** Lightweight health check — use to verify dev server is reachable */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "store-group-buy",
    timestamp: new Date().toISOString(),
  });
}
