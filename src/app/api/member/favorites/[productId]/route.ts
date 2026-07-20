import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { FavoriteTargetType } from "@/lib/types/database";

const VALID: FavoriteTargetType[] = ["product", "recipe", "video"];

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { productId: targetId } = await params;
  const typeParam = new URL(request.url).searchParams.get("type") ?? "product";
  const targetType = VALID.includes(typeParam as FavoriteTargetType)
    ? (typeParam as FavoriteTargetType)
    : "product";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const userId = auth!.profile.id;

  const { error: deleteError } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  if (deleteError) {
    if (deleteError.code === "42P01" && targetType === "product") {
      const legacy = await supabase
        .from("product_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", targetId);
      if (legacy.error) return NextResponse.json({ error: "取消收藏失敗" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "取消收藏失敗" }, { status: 500 });
  }

  if (targetType === "product") {
    await supabase.from("product_favorites").delete().eq("user_id", userId).eq("product_id", targetId);
  }

  return NextResponse.json({ ok: true });
}
