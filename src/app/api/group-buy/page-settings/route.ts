import { NextResponse } from "next/server";
import { getGroupBuyPageSettings } from "@/lib/group-buy/settings-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getGroupBuyPageSettings();
  return NextResponse.json(
    { settings },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
