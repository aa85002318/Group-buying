import { NextResponse } from "next/server";
import {
  getShippingDocumentForStorefront,
  getSiteDocument,
} from "@/lib/site-pages/service";
import { isSiteDocumentKey } from "@/lib/site-pages/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ key: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!isSiteDocumentKey(key)) {
    return NextResponse.json({ error: "找不到文件" }, { status: 404 });
  }

  const document =
    key === "shipping"
      ? await getShippingDocumentForStorefront()
      : await getSiteDocument(key, { publishedOnly: true });

  return NextResponse.json(
    { document },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
