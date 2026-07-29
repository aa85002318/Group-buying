import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { DEFAULT_BRANDING, mergeBrandingSettings } from "@/lib/branding";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ branding: DEFAULT_BRANDING });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "branding")
      .maybeSingle();

    if (error || !data?.value) {
      return NextResponse.json({ branding: DEFAULT_BRANDING });
    }
    return NextResponse.json({ branding: mergeBrandingSettings(data.value) });
  } catch {
    return NextResponse.json({ branding: DEFAULT_BRANDING });
  }
}
