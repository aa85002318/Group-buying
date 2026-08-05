import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { logAudit, requireAdmin } from "@/lib/auth";
import {
  mergeRecipePageSettings,
  validateRecipePageSettings,
} from "@/lib/recipes/page-settings";
import {
  getRecipePageSettings,
  saveRecipePageSettings,
} from "@/lib/recipes/settings-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const settings = await getRecipePageSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效的請求內容" }, { status: 400 });
  }

  const settings = mergeRecipePageSettings(body.settings ?? body);
  const validationError = validateRecipePageSettings(settings);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const result = await saveRecipePageSettings(settings, auth!.profile.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  try {
    revalidatePath("/recipes");
    revalidatePath("/admin/recipes/settings");
  } catch {
    // ignore when next cache context is unavailable
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "recipes_page_settings",
    "recipes_page",
    null,
    { hero: settings.hero },
    request as never
  );

  return NextResponse.json({
    settings: result.settings,
    message: "食譜頁 Hero Banner 已更新",
  });
}
