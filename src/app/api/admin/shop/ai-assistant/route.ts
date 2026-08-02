import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_AI_ASSISTANT_SETTINGS,
  parseAiAssistantSettings,
  parseAiAssistantTags,
} from "@/lib/shop/ai-recipe-assistant";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/ai-assistant */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_AI_ASSISTANT_SETTINGS });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_ai_assistant_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    settings: parseAiAssistantSettings((data as Record<string, unknown>) ?? undefined),
  });
}

/** PATCH /api/admin/shop/ai-assistant */
export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      settings: parseAiAssistantSettings({ ...DEFAULT_AI_ASSISTANT_SETTINGS, ...body }),
    });
  }

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("shop_ai_assistant_settings")
    .select("*")
    .eq("singleton_key", "main")
    .maybeSingle();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.is_visible !== undefined) updates.is_visible = Boolean(body.is_visible);
  if (body.title !== undefined) updates.title = String(body.title).trim() || DEFAULT_AI_ASSISTANT_SETTINGS.title;
  if (body.subtitle !== undefined)
    updates.subtitle = String(body.subtitle).trim() || DEFAULT_AI_ASSISTANT_SETTINGS.subtitle;
  if (body.placeholder !== undefined)
    updates.placeholder =
      String(body.placeholder).trim() || DEFAULT_AI_ASSISTANT_SETTINGS.placeholder;
  if (body.cta_text !== undefined)
    updates.cta_text = String(body.cta_text).trim() || DEFAULT_AI_ASSISTANT_SETTINGS.cta_text;
  if (body.cta_href !== undefined)
    updates.cta_href = String(body.cta_href).trim() || DEFAULT_AI_ASSISTANT_SETTINGS.cta_href;
  if (body.ip_image_url !== undefined)
    updates.ip_image_url =
      String(body.ip_image_url).trim() || DEFAULT_AI_ASSISTANT_SETTINGS.ip_image_url;
  if (body.background_image_url !== undefined) {
    const v = String(body.background_image_url ?? "").trim();
    updates.background_image_url = v || null;
  }
  if (body.background_color !== undefined) {
    const hex = String(body.background_color).trim();
    updates.background_color = /^#[0-9A-Fa-f]{6}$/.test(hex)
      ? hex
      : DEFAULT_AI_ASSISTANT_SETTINGS.background_color;
  }
  if (body.popular_tags !== undefined) {
    updates.popular_tags = parseAiAssistantTags(body.popular_tags);
  }

  const { data, error } = await admin
    .from("shop_ai_assistant_settings")
    .upsert(
      {
        singleton_key: "main",
        is_visible:
          updates.is_visible !== undefined
            ? updates.is_visible
            : (old?.is_visible ?? true),
        title:
          updates.title !== undefined
            ? updates.title
            : (old?.title ?? DEFAULT_AI_ASSISTANT_SETTINGS.title),
        subtitle:
          updates.subtitle !== undefined
            ? updates.subtitle
            : (old?.subtitle ?? DEFAULT_AI_ASSISTANT_SETTINGS.subtitle),
        placeholder:
          updates.placeholder !== undefined
            ? updates.placeholder
            : (old?.placeholder ?? DEFAULT_AI_ASSISTANT_SETTINGS.placeholder),
        cta_text:
          updates.cta_text !== undefined
            ? updates.cta_text
            : (old?.cta_text ?? DEFAULT_AI_ASSISTANT_SETTINGS.cta_text),
        cta_href:
          updates.cta_href !== undefined
            ? updates.cta_href
            : (old?.cta_href ?? DEFAULT_AI_ASSISTANT_SETTINGS.cta_href),
        ip_image_url:
          updates.ip_image_url !== undefined
            ? updates.ip_image_url
            : (old?.ip_image_url ?? DEFAULT_AI_ASSISTANT_SETTINGS.ip_image_url),
        background_image_url:
          updates.background_image_url !== undefined
            ? updates.background_image_url
            : (old?.background_image_url ?? null),
        background_color:
          updates.background_color !== undefined
            ? updates.background_color
            : (old?.background_color ?? DEFAULT_AI_ASSISTANT_SETTINGS.background_color),
        popular_tags:
          updates.popular_tags !== undefined
            ? updates.popular_tags
            : (old?.popular_tags ?? DEFAULT_AI_ASSISTANT_SETTINGS.popular_tags),
        updated_at: updates.updated_at,
      },
      { onConflict: "singleton_key" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "update",
    "shop_ai_assistant_settings",
    "main",
    old,
    data,
    request as never
  );

  return NextResponse.json({
    settings: parseAiAssistantSettings(data as Record<string, unknown>),
  });
}
