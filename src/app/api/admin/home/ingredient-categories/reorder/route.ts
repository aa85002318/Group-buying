import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/* PUT /api/admin/home/ingredient-categories/reorder
   body: { order: Array<{ id: string; sort_order: number }> } */
export async function PUT(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  try {
    const admin = createAdminClient();
    const { order } = await req.json() as { order: Array<{ id: string; sort_order: number }> };
    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order array required" }, { status: 400 });
    }
    await Promise.all(
      order.map(({ id, sort_order }) =>
        admin
          .from("home_ingredient_categories")
          .update({ sort_order, updated_at: new Date().toISOString() })
          .eq("id", id)
      )
    );
    revalidatePath("/");
    revalidatePath("/api/home/ingredient-categories");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
