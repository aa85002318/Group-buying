import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ templates: [] });
  const admin = createAdminClient();
  const { data } = await admin
    .from("product_description_templates")
    .select("id, name, template_key, style_config, is_active")
    .eq("is_active", true)
    .order("name");
  return NextResponse.json({ templates: data ?? [] });
}
