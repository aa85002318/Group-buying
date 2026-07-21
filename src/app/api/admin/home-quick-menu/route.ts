import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeLinkUrl } from "@/lib/cms/safeHtml";
import {
  DEFAULT_HOME_QUICK_MENU_ITEMS,
  normalizeQuickMenuItem,
  type HomeQuickMenuItem,
  type QuickMenuLinkTarget,
} from "@/lib/home/quick-menu";

function validatePayload(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const link_url = String(body.link_url ?? "").trim();
  if (!title) return "請填寫選單標題";
  if (title.length > 20) return "標題最多 20 個字元";
  if (!link_url) return "請填寫連結網址";
  if (!isSafeLinkUrl(link_url)) return "連結網址格式不正確";
  const link_target = body.link_target === "_blank" ? "_blank" : "_self";
  return {
    title,
    icon_url: body.icon_url ? String(body.icon_url).trim() : null,
    icon_key: body.icon_key ? String(body.icon_key).trim() : null,
    link_url,
    link_target: link_target as QuickMenuLinkTarget,
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
    return NextResponse.json({ items: DEFAULT_HOME_QUICK_MENU_ITEMS });
  }

  const admin = createAdminClient();
  const { data, error: qErr } = await admin
    .from("home_quick_menu_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const items = ((data ?? []) as HomeQuickMenuItem[]).map(normalizeQuickMenuItem);
  return NextResponse.json({
    items: items.length > 0 ? items : DEFAULT_HOME_QUICK_MENU_ITEMS,
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

  if (!validated.icon_url && !validated.icon_key) {
    return NextResponse.json(
      { error: "請上傳圖示圖片或選擇內建圖示" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      item: normalizeQuickMenuItem({ ...validated, id: `local-${Date.now()}` }),
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("home_quick_menu_items")
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
    await logAudit(auth.profile.id, "create_home_quick_menu", "home_quick_menu_items", data.id, null, data);
  }

  return NextResponse.json({ ok: true, item: normalizeQuickMenuItem(data) });
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
        .from("home_quick_menu_items")
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

  if (body.title !== undefined || body.link_url !== undefined) {
    const validated = validatePayload({ ...body, title: body.title ?? "x", link_url: body.link_url ?? "/" });
    if (typeof validated === "string" && (body.title !== undefined || body.link_url !== undefined)) {
      // only validate fields being set partially below
    }
  }

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "請填寫選單標題" }, { status: 400 });
    if (title.length > 20) return NextResponse.json({ error: "標題最多 20 個字元" }, { status: 400 });
    patch.title = title;
  }
  if (body.icon_url !== undefined) patch.icon_url = body.icon_url ? String(body.icon_url).trim() : null;
  if (body.icon_key !== undefined) patch.icon_key = body.icon_key ? String(body.icon_key).trim() : null;
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
  if (body.alt_text !== undefined) patch.alt_text = body.alt_text ? String(body.alt_text).trim() : null;
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes).trim() : null;
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order);
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("home_quick_menu_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "update_home_quick_menu", "home_quick_menu_items", id, null, patch);
  }

  return NextResponse.json({ ok: true, item: normalizeQuickMenuItem(data) });
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
  const { error } = await admin.from("home_quick_menu_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "delete_home_quick_menu", "home_quick_menu_items", id, null, null);
  }

  return NextResponse.json({ ok: true });
}
