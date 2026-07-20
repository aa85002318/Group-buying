import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "課程資料未設定" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("baking_courses").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "找不到課程" }, { status: 404 });

  return NextResponse.json({
    course: {
      ...data,
      seats_left: Math.max(0, Number(data.capacity) - Number(data.enrolled_count)),
    },
  });
}
