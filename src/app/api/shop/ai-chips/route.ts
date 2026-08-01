import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { DEFAULT_AI_CHIPS, mapAiChipRow } from "@/lib/shop/ai-assistant";

export const dynamic = "force-dynamic";

/** GET /api/shop/ai-chips — active AI prompt chips */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ chips: DEFAULT_AI_CHIPS });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_ai_chips")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json({ chips: DEFAULT_AI_CHIPS });
    }

    return NextResponse.json({
      chips: data.map((row) => mapAiChipRow(row as Record<string, unknown>)),
    });
  } catch {
    return NextResponse.json({ chips: DEFAULT_AI_CHIPS });
  }
}
