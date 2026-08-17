import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_HOME_SETTINGS,
  parseShopHomeSettings,
  parseShopPopularKeywords,
  settingsToDbPayload,
  type ShopHomeSettings,
} from "@/lib/shop/home-settings";

export const dynamic = "force-dynamic";

async function loadBundle(admin: ReturnType<typeof createAdminClient>) {
  const [{ data: settingsRow }, { data: keywordRows }] = await Promise.all([
    admin.from("shop_home_settings").select("*").eq("singleton_key", "main").maybeSingle(),
    admin
      .from("shop_popular_keywords")
      .select("id, keyword, url, sort_order, is_active")
      .order("sort_order", { ascending: true }),
  ]);
  return {
    settings: parseShopHomeSettings((settingsRow as Record<string, unknown>) ?? undefined),
    keywords: parseShopPopularKeywords(keywordRows),
  };
}

/** GET /api/admin/shop/home-settings */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      settings: DEFAULT_SHOP_HOME_SETTINGS,
      keywords: [],
    });
  }

  const admin = createAdminClient();
  return NextResponse.json(await loadBundle(admin));
}

/** PATCH /api/admin/shop/home-settings */
export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const incoming = parseShopHomeSettings({
    ...DEFAULT_SHOP_HOME_SETTINGS,
    ...(body.settings && typeof body.settings === "object" ? body.settings : body),
  } as Record<string, unknown>);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: incoming, keywords: [] });
  }

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("shop_home_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();

  const payload = settingsToDbPayload(incoming, auth!.profile.id);
  const { data, error } = await admin
    .from("shop_home_settings")
    .upsert(payload, { onConflict: "singleton_key" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(body.keywords)) {
    const nextKeywords = parseShopPopularKeywords(body.keywords).slice(0, 8);
    await admin.from("shop_popular_keywords").delete().gte("sort_order", -1);
    if (nextKeywords.length) {
      const { error: kwError } = await admin.from("shop_popular_keywords").insert(
        nextKeywords.map((k, i) => ({
          keyword: k.keyword,
          url: k.url,
          sort_order: (i + 1) * 10,
          is_active: k.is_active,
        }))
      );
      if (kwError) return NextResponse.json({ error: kwError.message }, { status: 500 });
    }
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "shop_home_settings",
    "main",
    old,
    data,
    request as never
  );

  const bundle = await loadBundle(admin);
  return NextResponse.json(bundle);
}

export type { ShopHomeSettings };
