import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

const STATUSES = new Set(["open", "answered", "resolved", "locked", "hidden"]);

/** List / moderate recipe discussions (admin). */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ discussions: [] });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("recipe_discussions")
    .select("*")
    .eq("recipe_id", id)
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ discussions: data ?? [] });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;
  const body = await request.json();
  const discussionId = String(body.id ?? "");
  if (!discussionId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (body.status != null && !STATUSES.has(String(body.status))) {
    return NextResponse.json({ error: "status 無效" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ discussion: body });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("recipe_discussions")
    .select("*")
    .eq("id", discussionId)
    .eq("recipe_id", recipeId)
    .single();
  if (!old) return NextResponse.json({ error: "討論不存在" }, { status: 404 });

  const { data, error: updateError } = await admin
    .from("recipe_discussions")
    .update(updates)
    .eq("id", discussionId)
    .eq("recipe_id", recipeId)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "update_recipe_discussion",
    "recipe_discussion",
    discussionId,
    old,
    data
  );
  return NextResponse.json({ discussion: data });
}
