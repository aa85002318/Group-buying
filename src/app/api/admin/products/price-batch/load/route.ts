import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("id, name, sku, barcode, status, is_active, price, sale_price, cost_price, original_price")
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
        barcode: p!.barcode ?? null,
        status: p!.status ?? (p!.is_active ? "active" : "inactive"),
        price: Number(p!.price ?? 0),
        sale_price: p!.sale_price != null ? Number(p!.sale_price) : null,
        cost_price: p!.cost_price != null ? Number(p!.cost_price) : null,
        original_price: p!.original_price != null ? Number(p!.original_price) : null,
      }));

    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗", products: [] },
      { status: 400 }
    );
  }
}
