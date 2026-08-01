import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { DEFAULT_SHOP_FEATURES } from "@/lib/shop/features";

export const dynamic = "force-dynamic";

/** GET /api/shop/features — up to 3 active feature blocks */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ features: DEFAULT_SHOP_FEATURES });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_features")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(3);

    if (error || !data?.length) {
      return NextResponse.json({ features: DEFAULT_SHOP_FEATURES });
    }

    return NextResponse.json({ features: data });
  } catch {
    return NextResponse.json({ features: DEFAULT_SHOP_FEATURES });
  }
}
