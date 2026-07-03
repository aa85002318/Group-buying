import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockLivestreams } from "@/lib/mock-data";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ livestreams: mockLivestreams });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("livestreams")
    .select("*")
    .order("scheduled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ livestreams: data });
}
