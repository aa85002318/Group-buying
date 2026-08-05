import { NextResponse } from "next/server";
import { requireContentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { markRecipeStoryManual, syncRecipeStoryFromContent } from "@/lib/recipes/auto-story-sync";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

/** POST { force?: boolean, markManual?: boolean } — sync or mark flipbook as manual. */
export async function POST(request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mock: true });
  }

  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  if (body.markManual === true) {
    await markRecipeStoryManual(admin, id);
    return NextResponse.json({ ok: true, mode: "manual" });
  }

  const result = await syncRecipeStoryFromContent(admin, id, {
    force: body.force === true,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}
