import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const event = getMockGroupBuyEventsWithProducts().find((e) => e.id === id);
    if (!event) return NextResponse.json({ error: "團購不存在" }, { status: 404 });
    return NextResponse.json({ event });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_buy_events")
    .select("*, group_buy_products(*, products(*)), stores(name, address)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "團購不存在" }, { status: 404 });
  return NextResponse.json({ event: data });
}
