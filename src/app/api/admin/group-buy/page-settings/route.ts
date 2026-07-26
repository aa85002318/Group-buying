import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, logAudit } from "@/lib/auth";
import {
  mergeGroupBuyPageSettings,
  validateGroupBuyPageSettings,
} from "@/lib/group-buy/page-settings";
import {
  getGroupBuyPageSettings,
  saveGroupBuyPageSettings,
} from "@/lib/group-buy/settings-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const settings = await getGroupBuyPageSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效的請求內容" }, { status: 400 });
  }

  const settings = mergeGroupBuyPageSettings(body.settings ?? body);
  const validationError = validateGroupBuyPageSettings(settings);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const result = await saveGroupBuyPageSettings(settings, auth!.profile.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  try {
    revalidatePath("/group-buy");
    revalidatePath("/admin/group-buy/settings");
  } catch {
    // ignore when not in Next cache context
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "group_buy_page_settings",
    "group_buy_page",
    null,
    { title: settings.title, defaultTab: settings.defaultTab },
    request as never
  );

  return NextResponse.json({
    settings: result.settings,
    message: "團購頁面設定已更新",
  });
}
