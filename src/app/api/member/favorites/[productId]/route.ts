import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { productId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("product_favorites")
    .delete()
    .eq("user_id", auth!.profile.id)
    .eq("product_id", productId);

  if (deleteError) return NextResponse.json({ error: "取消收藏失敗" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
