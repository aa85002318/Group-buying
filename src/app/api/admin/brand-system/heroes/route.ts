import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

type TagInput = {
  id?: string;
  label?: string;
  keyword?: string | null;
  linkType?: string;
  link_type?: string;
  targetUrl?: string | null;
  target_url?: string | null;
  sortOrder?: number;
  sort_order?: number;
  enabled?: boolean;
};

async function syncHeroTags(
  admin: ReturnType<typeof createAdminClient>,
  heroId: string,
  tags: TagInput[] | undefined
) {
  if (!Array.isArray(tags)) return;

  const { data: existing } = await admin
    .from("brand_hero_tags")
    .select("id")
    .eq("hero_id", heroId);

  const keepIds = new Set<string>();

  for (let i = 0; i < tags.length; i++) {
    const t = tags[i];
    const label = String(t.label ?? "").trim();
    if (!label) continue;

    const row = {
      hero_id: heroId,
      label,
      keyword: t.keyword ?? t.label ?? null,
      link_type: (t.linkType ?? t.link_type ?? "search") === "url" ? "url" : "search",
      target_url: t.targetUrl ?? t.target_url ?? null,
      sort_order: Number(t.sortOrder ?? t.sort_order ?? (i + 1) * 10),
      enabled: t.enabled !== false,
      updated_at: new Date().toISOString(),
    };

    const id = t.id && !String(t.id).startsWith("tag-") ? String(t.id) : null;
    if (id) {
      await admin.from("brand_hero_tags").update(row).eq("id", id);
      keepIds.add(id);
    } else {
      const { data: inserted } = await admin
        .from("brand_hero_tags")
        .insert(row)
        .select("id")
        .single();
      if (inserted?.id) keepIds.add(String(inserted.id));
    }
  }

  const toDelete = (existing ?? [])
    .map((r) => String(r.id))
    .filter((id) => !keepIds.has(id));

  if (toDelete.length) {
    await admin.from("brand_hero_tags").delete().in("id", toDelete);
  }
}

function revalidateHero(heroKey?: string | null) {
  try {
    revalidateTag("brand-system");
    if (heroKey) {
      revalidateTag(`brand-hero:${heroKey}`);
      revalidatePath(`/api/brand-system/heroes/${heroKey}`);
    }
    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath("/products");
    revalidatePath("/courses");
    revalidatePath("/group-buy");
  } catch {
    // ignore in non-next contexts
  }
}

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ heroes: [] });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("brand_heroes")
    .select("*, brand_hero_tags(*)")
    .order("hero_key");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ heroes: data ?? [] });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ hero: body }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("brand_heroes")
    .insert({
      hero_key: body.hero_key,
      name: body.name,
      title: body.title,
      subtitle: body.subtitle ?? null,
      show_title: body.show_title !== false,
      show_subtitle: body.show_subtitle !== false,
      desktop_image_url: body.desktop_image_url ?? null,
      mobile_image_url: body.mobile_image_url ?? null,
      image_alt: body.image_alt ?? null,
      image_position: body.image_position ?? "center",
      search_placeholder: body.search_placeholder ?? null,
      search_scope: body.search_scope ?? "global",
      show_popular_tags: body.show_popular_tags !== false,
      enabled: body.enabled !== false,
      status: body.status ?? "draft",
      start_at: body.start_at ?? null,
      end_at: body.end_at ?? null,
      created_by: auth!.profile.id,
      updated_by: auth!.profile.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncHeroTags(admin, data.id, body.tags);
  await logAudit(auth!.profile.id, "create", "brand_heroes", data.id, null, data, request as never);
  revalidateHero(data.hero_key);
  return NextResponse.json({ hero: data }, { status: 201 });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ hero: body });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("brand_heroes").select("*").eq("id", id).maybeSingle();

  const updates: Record<string, unknown> = {
    updated_by: auth!.profile.id,
    updated_at: new Date().toISOString(),
  };
  for (const key of [
    "name",
    "title",
    "subtitle",
    "show_title",
    "show_subtitle",
    "desktop_image_url",
    "mobile_image_url",
    "image_alt",
    "image_position",
    "search_placeholder",
    "search_scope",
    "show_popular_tags",
    "enabled",
    "status",
    "start_at",
    "end_at",
  ]) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await admin
    .from("brand_heroes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncHeroTags(admin, id, body.tags);

  await admin.from("brand_versions").insert({
    resource_type: "brand_heroes",
    resource_id: id,
    before_data: old,
    after_data: data,
    action: body.status === "published" ? "publish" : "update",
    created_by: auth!.profile.id,
  });

  await logAudit(auth!.profile.id, "update", "brand_heroes", id, old, data, request as never);
  revalidateHero(data?.hero_key);

  return NextResponse.json({ hero: data });
}
