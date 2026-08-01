import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const SELECT =
  "id, name, image_url, price, sale_price, website_price, is_active, is_popular, popular_sort_order, publish_website, stock, status, package_spec, unit, brands:brand_id(name)";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ products: [], candidates: [] });
  }

  const admin = createAdminClient();
  const [{ data: popular }, { data: candidates }] = await Promise.all([
    admin
      .from("products")
      .select(SELECT)
      .eq("is_popular", true)
      .order("popular_sort_order", { ascending: true })
      .limit(50),
    admin
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .eq("publish_website", true)
      .eq("is_popular", false)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  return NextResponse.json({
    products: popular ?? [],
    candidates: candidates ?? [],
  });
}

export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json();
  const admin = createAdminClient();

  if (Array.isArray(body.ordered_ids)) {
    const ids = body.ordered_ids.map(String);
    for (let i = 0; i < ids.length; i += 1) {
      await admin
        .from("products")
        .update({
          is_popular: true,
          popular_sort_order: (i + 1) * 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ids[i]);
    }
    await logAudit(
      auth!.profile.id,
      "update",
      "shop_popular_products",
      "reorder",
      null,
      { ordered_ids: ids },
      request as never
    );
    return NextResponse.json({ ok: true });
  }

  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.is_popular === "boolean") updates.is_popular = body.is_popular;
  if (body.popular_sort_order != null) {
    updates.popular_sort_order = Number(body.popular_sort_order) || 0;
  }
  if (body.is_popular === false) {
    updates.popular_sort_order = 0;
  }

  const { data, error } = await admin
    .from("products")
    .update(updates)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "update",
    "shop_popular_products",
    id,
    null,
    updates,
    request as never
  );
  return NextResponse.json({ product: data });
}
