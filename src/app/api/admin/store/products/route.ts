import { NextResponse } from "next/server";
import { requireStoreOps } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 100) || 100);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ products: [] });
  }

  const admin = createAdminClient();
  let query = admin
    .from("products")
    .select(
      "id, name, sku, barcode, image_url, stock, publish_store, supplier_name, unit, short_name, safety_stock, is_active"
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%,short_name.ilike.%${q}%`
    );
  }

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}
