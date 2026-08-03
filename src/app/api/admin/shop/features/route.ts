import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { DEFAULT_SHOP_FEATURES } from "@/lib/shop/features";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/features */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ features: DEFAULT_SHOP_FEATURES });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_features")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    features: data?.length ? data : DEFAULT_SHOP_FEATURES,
  });
}

/** POST /api/admin/shop/features — create only if under 3 active slots preferred */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const title = String(body.title ?? "").trim() || "商城特色";
  const imageUrl = String(body.image_url ?? "").trim();
  if (!imageUrl && !title) {
    return NextResponse.json({ error: "請上傳 banner 圖" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { feature: { id: `mock-${Date.now()}`, title, image_url: imageUrl } },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("shop_features")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "商城特色固定最多 3 筆，請編輯現有項目。" },
      { status: 400 }
    );
  }

  const payload = {
    icon: String(body.icon ?? "star").trim() || "star",
    title,
    subtitle: String(body.subtitle ?? "").trim(),
    image_url: imageUrl || null,
    link_type: body.link_type === "external" ? "external" : "internal",
    link_url: String(body.link_url ?? "/").trim() || "/",
    background_color: String(body.background_color ?? "#F7F8FB").trim() || "#F7F8FB",
    sort_order: Number(body.sort_order ?? 1) || 1,
    is_active: body.is_active !== false,
  };

  const { data, error } = await admin
    .from("shop_features")
    .insert(payload)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "create", "shop_feature", data.id, null, data, request as never);
  return NextResponse.json({ feature: data }, { status: 201 });
}
