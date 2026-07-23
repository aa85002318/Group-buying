import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

/** Manage AI prompt chips for a recipe step (admin). Body always includes step_id. */
export async function GET(request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  await params;
  const stepId = new URL(request.url).searchParams.get("stepId");
  if (!stepId) return NextResponse.json({ error: "缺少 stepId" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ prompts: [] });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("recipe_step_ai_prompts")
    .select("*")
    .eq("step_id", stepId)
    .order("sort_order");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ prompts: data ?? [] });
}

export async function POST(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  await params;
  const body = await request.json();
  if (!body.step_id || !body.label || !body.prompt) {
    return NextResponse.json({ error: "缺少 step_id / label / prompt" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { prompt: { id: `prompt-${Date.now()}`, ...body } },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("recipe_step_ai_prompts")
    .insert({
      step_id: body.step_id,
      label: String(body.label),
      prompt: String(body.prompt),
      sort_order: Number(body.sort_order ?? 0),
      is_active: body.is_active !== false,
    })
    .select("*")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "create_recipe_step_ai_prompt",
    "recipe_step_ai_prompt",
    data.id,
    null,
    data
  );
  return NextResponse.json({ prompt: data }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  await params;
  const body = await request.json();
  const promptId = String(body.id ?? "");
  if (!promptId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ prompt: body });

  const updates: Record<string, unknown> = {};
  for (const key of ["label", "prompt", "sort_order", "is_active"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (updates.sort_order != null) updates.sort_order = Number(updates.sort_order);

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("recipe_step_ai_prompts")
    .update(updates)
    .eq("id", promptId)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "update_recipe_step_ai_prompt",
    "recipe_step_ai_prompt",
    promptId,
    null,
    data
  );
  return NextResponse.json({ prompt: data });
}

export async function DELETE(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  await params;
  const promptId = new URL(request.url).searchParams.get("id");
  if (!promptId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("recipe_step_ai_prompts")
    .delete()
    .eq("id", promptId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "delete_recipe_step_ai_prompt",
    "recipe_step_ai_prompt",
    promptId,
    null,
    null
  );
  return NextResponse.json({ ok: true });
}
