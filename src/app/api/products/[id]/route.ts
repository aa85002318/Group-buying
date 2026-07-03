import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockProductById } from "@/lib/mock-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const product = getMockProductById(id);
    if (!product) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    return NextResponse.json({ product });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_categories(name, slug)")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  return NextResponse.json({ product: data });
}
