import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockLivestreams } from "@/lib/mock-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const livestream = mockLivestreams.find((l) => l.id === id);
    if (!livestream) return NextResponse.json({ error: "直播不存在" }, { status: 404 });
    return NextResponse.json({ livestream });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("livestreams")
    .select("*, livestream_products(*, products(*))")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "直播不存在" }, { status: 404 });
  return NextResponse.json({ livestream: data });
}
