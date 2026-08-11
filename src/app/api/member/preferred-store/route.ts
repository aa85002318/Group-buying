import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      preferredStoreId: null,
      store: null,
    });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("preferred_store_id")
    .eq("id", auth!.profile.id)
    .single();

  const storeId = profile?.preferred_store_id ?? null;
  let store = null;
  if (storeId) {
    const { data } = await admin
      .from("stores")
      .select("id, name, address, phone, city")
      .eq("id", storeId)
      .maybeSingle();
    store = data;
  }

  return NextResponse.json({ preferredStoreId: storeId, store });
}

export async function PUT(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const storeId =
    body.storeId === null || body.storeId === ""
      ? null
      : typeof body.storeId === "string"
        ? body.storeId
        : null;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, preferredStoreId: storeId });
  }

  const admin = createAdminClient();
  if (storeId) {
    const { data: store } = await admin
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .maybeSingle();
    if (!store) {
      return NextResponse.json({ error: "找不到門市" }, { status: 404 });
    }
  }

  const { error: updError } = await admin
    .from("profiles")
    .update({ preferred_store_id: storeId })
    .eq("id", auth!.profile.id);

  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, preferredStoreId: storeId });
}
