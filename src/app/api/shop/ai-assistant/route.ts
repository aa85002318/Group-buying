import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_AI_ASSISTANT_SETTINGS,
  parseAiAssistantSettings,
} from "@/lib/shop/ai-recipe-assistant";

export const dynamic = "force-dynamic";

/** GET /api/shop/ai-assistant — public Version A block settings */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_AI_ASSISTANT_SETTINGS });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_ai_assistant_settings")
      .select("*")
      .eq("singleton_key", "main")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ settings: DEFAULT_AI_ASSISTANT_SETTINGS });
    }
    return NextResponse.json({
      settings: parseAiAssistantSettings(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ settings: DEFAULT_AI_ASSISTANT_SETTINGS });
  }
}
