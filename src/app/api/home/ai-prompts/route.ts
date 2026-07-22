import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { HomeAiPrompt } from "@/lib/types/database";

const MOCK_PROMPTS: HomeAiPrompt[] = [
  {
    id: "mock-1",
    label: "低筋麵粉可以做什麼？",
    prompt: "我只有低筋麵粉可以做什麼？",
    sort_order: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    label: "巴斯克裂開怎麼辦？",
    prompt: "巴斯克裂開怎麼辦？",
    sort_order: 20,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ prompts: MOCK_PROMPTS });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_ai_prompts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompts: data ?? [] });
}
