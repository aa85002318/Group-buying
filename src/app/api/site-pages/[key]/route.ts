import { NextResponse } from "next/server";
import { getSiteDocument } from "@/lib/site-pages/service";
import { isSiteDocumentKey } from "@/lib/site-pages/types";

type Ctx = { params: Promise<{ key: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!isSiteDocumentKey(key)) {
    return NextResponse.json({ error: "找不到文件" }, { status: 404 });
  }

  const document = await getSiteDocument(key, { publishedOnly: true });
  return NextResponse.json({ document });
}
