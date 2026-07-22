import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeLinkUrl } from "@/lib/cms/safeHtml";
import {
  DEFAULT_HOME_FEATURE_DUO_ITEMS,
  normalizeFeatureDuoItem,
  type FeatureDuoLinkTarget,
  type HomeFeatureDuoItem,
} from "@/lib/home/feature-duo";

function validatePayload(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const link_url = String(body.link_url ?? "").trim();
  const slot_key = String(body.slot_key ?? "").trim();
  if (!title) return "請填寫標題（僅後台辨識用）";
  if (title.length > 40) return "標題最多 40 個字元";
  if (!link_url) return "請填寫連結網址";
  if (!isSafeLinkUrl(link_url)) return "連結網址格式不正確";
  if (!slot_key) return "缺少 slot_key";
  const link_target = body.link_target === "_blank" ? "_blank" : "_self";
  return {
    slot_key,
    title,
    image_url: body.image_url ? String(body.image_url).trim() : null,
    link_url,
    link_target: link_target as FeatureDuoLinkTarget,
    alt_text: body.alt_text ? String(body.alt_text).trim() : null,
    notes: body.notes ? String(body.notes).trim() : null,
    sort_order: Number(body.sort_order ?? 0),
    is_active: body.is_active !== false && body.is_active !== "inactive",
  };
}

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: DEFAULT_HOME_FEATURE_DUO_ITEMS });
  }

  const admin = createAdminClient();
  const { data, error: qErr } = await admin
    .from("home_feature_duo_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const items = ((data ?? []) as HomeFeatureDuoItem[]).map(normalizeFeatureDuoItem);
  return NextResponse.json({
    items: items.length > 0 ? items : DEFAULT_HOME_FEATURE_DUO_ITEMS,
  });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const validated = validatePayload(body);
  if (typeof validated === "string") {
    return NextResponse.json({ error: validated }, { status: 400 });
  }
  if (!validated.image_url) {
    return NextResponse.json({ error: "請上傳滿版圖片" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      item: normalizeFeatureDuoItem({ ...validated, id: `local-${Date.now()}` }),
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("home_feature_duo_items")
    .insert({
      ...validated,
      created_by: auth?.profile?.id ?? null,
      updated_by: auth?.profile?.id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(
      auth.profile.id,
      "create_home_feature_duo",
      "home_feature_duo_items",
      data.id,
      null,
      data
    );
  }

  return NextResponse.json({ ok: true, item: normalizeFeatureDuoItem(data) });
}

export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (Array.isArray(body.orderedIds)) {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true });
    }
    const admin = createAdminClient();
    const ids = body.orderedIds as string[];
    const updates = ids.map((itemId, index) =>
      admin
        .from("home_feature_duo_items")
        .update({
          sort_order: (index + 1) * 10,
          updated_by: auth?.profile?.id ?? null,
        })
        .eq("id", itemId)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = {
    updated_by: auth?.profile?.id ?? null,
  };

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "請填寫標題" }, { status: 400 });
    if (title.length > 40) {
      return NextResponse.json({ error: "標題最多 40 個字元" }, { status: 400 });
    }
    patch.title = title;
  }
  if (body.slot_key !== undefined) {
    const slot_key = String(body.slot_key).trim();
    if (!slot_key) return NextResponse.json({ error: "缺少 slot_key" }, { status: 400 });
    patch.slot_key = slot_key;
  }
  if (body.image_url !== undefined) {
    patch.image_url = body.image_url ? String(body.image_url).trim() : null;
  }
  if (body.link_url !== undefined) {
    const link_url = String(body.link_url).trim();
    if (!link_url) return NextResponse.json({ error: "請填寫連結網址" }, { status: 400 });
    if (!isSafeLinkUrl(link_url)) {
      return NextResponse.json({ error: "連結網址格式不正確" }, { status: 400 });
    }
    patch.link_url = link_url;
  }
  if (body.link_target !== undefined) {
    patch.link_target = body.link_target === "_blank" ? "_blank" : "_self";
  }
  if (body.alt_text !== undefined) {
    patch.alt_text = body.alt_text ? String(body.alt_text).trim() : null;
  }
  if (body.notes !== undefined) {
    patch.notes = body.notes ? String(body.notes).trim() : null;
  }
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order);
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("home_feature_duo_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(
      auth.profile.id,
      "update_home_feature_duo",
      "home_feature_duo_items",
      id,
      null,
      patch
    );
  }

  return NextResponse.json({ ok: true, item: normalizeFeatureDuoItem(data) });
}

export async function DELETE(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("home_feature_duo_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(
      auth.profile.id,
      "delete_home_feature_duo",
      "home_feature_duo_items",
      id,
      null,
      null
    );
  }

  return NextResponse.json({ ok: true });
}
