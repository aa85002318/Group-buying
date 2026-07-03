import { NextResponse } from "next/server";

/** LINE Messaging API webhook placeholder — future integration */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  console.log("[LINE webhook stub]", JSON.stringify(body).slice(0, 500));
  return NextResponse.json({ ok: true, message: "LINE webhook stub — not yet implemented" });
}

export async function GET() {
  return NextResponse.json({ status: "LINE webhook endpoint ready" });
}
