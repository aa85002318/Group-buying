import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanRichTextHtml } from "@/lib/cms/safeHtml";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
});

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫", products: [] }, { status: 503 });
  }

  try {
    const { productIds } = bodySchema.parse(await request.json());
    const admin = createAdminClient();
    const { data, error: dbErr } = await admin
      .from("products")
      .select("id, name, sku, status, is_active, rich_description, description, product_info, specifications")
      .in("id", productIds);
    if (dbErr) {
      return NextResponse.json({ error: dbErr.message, products: [] }, { status: 500 });
    }

    const byId = new Map((data ?? []).map((p) => [p.id, p]));
    const products = productIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        name: p!.name,
        sku: p!.sku ?? null,
        status: p!.status ?? (p!.is_active ? "active" : "inactive"),
        rich_description: cleanRichTextHtml(
          String(p!.rich_description ?? p!.description ?? "")
        ),
        product_info: cleanRichTextHtml(String(p!.product_info ?? "")),
        specifications: cleanRichTextHtml(String(p!.specifications ?? "")),
      }));

    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗", products: [] },
      { status: 400 }
    );
  }
}
