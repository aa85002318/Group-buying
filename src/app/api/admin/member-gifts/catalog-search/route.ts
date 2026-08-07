import { NextResponse } from "next/server";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** 活動條件用：搜尋／解析商品或分類（行銷／總管） */
export async function GET(request: Request) {
  const { error } = await requireGiftMarketing();
  if (error) return error;

  const url = new URL(request.url);
  const kind = String(url.searchParams.get("kind") ?? "product");
  const q = String(url.searchParams.get("q") ?? "").trim();
  const idsRaw = String(url.searchParams.get("ids") ?? "").trim();
  const ids = idsRaw
    ? idsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const limit = Math.min(40, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] });
  }

  const admin = createAdminClient();

  if (kind === "category") {
    let query = admin
      .from("product_categories")
      .select("id, name")
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (ids.length) query = query.in("id", ids);
    else if (q) query = query.ilike("name", `%${q}%`);
    const { data, error: qErr } = await query;
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    return NextResponse.json({
      items: (data ?? []).map((r) => ({ id: r.id, label: r.name, meta: undefined })),
    });
  }

  let query = admin
    .from("products")
    .select("id, name, sku")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (ids.length) query = query.in("id", ids);
  else if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  const { data, error: qErr } = await query;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({
    items: (data ?? []).map((r) => ({
      id: r.id,
      label: r.name,
      meta: r.sku ?? undefined,
    })),
  });
}
