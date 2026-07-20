import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackProductView } from "@/lib/services/recommendationService";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const body = await request.json();
  const productId = body.product_id?.trim();
  if (!productId) return NextResponse.json({ error: "缺少 product_id" }, { status: 400 });

  const auth = await getAuthUser();
  const admin = createAdminClient();
  await trackProductView(admin, productId, auth?.profile.id ?? null, body.session_id ?? null);
  return NextResponse.json({ ok: true });
}
