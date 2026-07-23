import { NextResponse } from "next/server";
import { getAuthUser, requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDemoSmartRecipeStatus,
  removeDemoSmartRecipe,
  seedDemoSmartRecipe,
} from "@/lib/demo/smart-recipe-demo";

async function canReadDemoStatus(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = await getAuthUser();
  const role = auth?.profile?.role;
  return role === "admin" || role === "content_editor";
}

export async function GET() {
  if (!(await canReadDemoStatus())) {
    return NextResponse.json({ error: "權限不足" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      exists: false,
      recipeId: null,
      slug: "chocolate-nut-soft-cookies-demo",
      demoKey: "chimeidiy-smart-recipe-demo-v1",
      counts: {},
    });
  }

  try {
    const status = await getDemoSmartRecipeStatus(createAdminClient());
    return NextResponse.json(status);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "查詢失敗" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 未設定" }, { status: 503 });
  }

  let body: { action?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的 JSON" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "seed" && action !== "remove") {
    return NextResponse.json({ error: 'action 需為 "seed" 或 "remove"' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    if (action === "seed") {
      const result = await seedDemoSmartRecipe(admin);
      await logAudit(
        auth!.profile.id,
        "seed_demo_smart_recipe",
        "recipe",
        result.recipeId,
        null,
        { demoKey: result.demoKey, slug: result.slug }
      );
      return NextResponse.json({ ok: true, action, ...result });
    }

    const result = await removeDemoSmartRecipe(admin);
    await logAudit(
      auth!.profile.id,
      "remove_demo_smart_recipe",
      "recipe",
      result.recipeId,
      { demoKey: "chimeidiy-smart-recipe-demo-v1" },
      null
    );
    return NextResponse.json({ ok: true, action, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "操作失敗";
    const status = message.includes("ALLOW_DEMO_SEED") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
