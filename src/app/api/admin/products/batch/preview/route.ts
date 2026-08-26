import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { type ProductBatchPatch } from "@/lib/admin/product-batch";
import { previewBatch, productBatchBodySchema } from "@/lib/admin/product-batch-preview";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const parsed = productBatchBodySchema.parse(await request.json());
    const preview = await previewBatch(parsed.productIds, parsed.patch as ProductBatchPatch);
    return NextResponse.json({ preview, runMode: parsed.runMode ?? "all_or_nothing" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "預覽失敗" },
      { status: 400 }
    );
  }
}
