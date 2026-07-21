import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      brands: [
        { id: "brand-1", name: "棋美點心屋", slug: "chimei", logo_url: null, is_active: true, product_count: 12 },
        { id: "brand-2", name: "Organic Plus", slug: "organic-plus", logo_url: null, is_active: true, product_count: 5 },
      ],
    });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("brands")
    .select("id, name, slug, logo_url, country, sort_order, is_active, created_at")
    .order("sort_order", { ascending: true })
    .order("name");

  if (fetchError) return NextResponse.json({ brands: [] });

  const brands = await Promise.all(
    (data ?? []).map(async (brand) => {
      const { count } = await admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brand.id);
      return { ...brand, product_count: count ?? 0 };
    })
  );

  return NextResponse.json({ brands });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "請填寫品牌名稱" }, { status: 400 });
  }

  const row = {
    name: body.name.trim(),
    slug: body.slug?.trim() || null,
    logo_url: body.logo_url?.trim() || null,
    country: body.country?.trim() || null,
    sort_order: Number(body.sort_order) || 0,
    is_active: body.is_active !== false,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ brand: { id: `brand-${Date.now()}`, ...row, product_count: 0 } });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("brands").insert(row).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "create", "brand", data.id, null, data);
  }

  return NextResponse.json({ brand: { ...data, product_count: 0 } });
}
