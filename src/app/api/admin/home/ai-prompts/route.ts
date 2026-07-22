import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ prompts: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("home_ai_prompts")
    .select("*")
    .order("sort_order", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ prompts: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!label || !prompt) {
    return NextResponse.json({ error: "請填寫標籤與提問內容" }, { status: 400 });
  }

  const payload = {
    label,
    prompt,
    sort_order: Number(body.sort_order) || 0,
    is_active: body.is_active !== false,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ prompt: { id: `prompt-${Date.now()}`, ...payload } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("home_ai_prompts")
    .insert(payload)
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_home_ai_prompt", "home_ai_prompts", data.id, null, data);
  return NextResponse.json({ prompt: data }, { status: 201 });
}
