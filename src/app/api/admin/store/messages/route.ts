import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayISO } from "@/lib/admin/store-ops";

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ messages: [] });
  }

  const url = new URL(request.url);
  const day = url.searchParams.get("date") || todayISO();
  const admin = createAdminClient();
  const dayStart = `${day}T00:00:00.000Z`;
  const dayEnd = `${day}T23:59:59.999Z`;

  const { data, error: qError } = await admin
    .from("store_messages")
    .select("*")
    .gte("created_at", dayStart)
    .lte("created_at", dayEnd)
    .order("created_at", { ascending: true })
    .limit(100);

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const text = String(body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "請輸入留言" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      item: {
        id: `tmp-${Date.now()}`,
        body: text,
        author_name: "門市人員",
        created_at: new Date().toISOString(),
      },
    });
  }

  const admin = createAdminClient();
  let storeId = (body.store_id as string | undefined) || null;
  if (!storeId) {
    const { data: store } = await admin
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    storeId = store?.id ?? null;
  }
  if (!storeId) return NextResponse.json({ error: "找不到可用門市" }, { status: 400 });

  const staffName =
    (auth!.profile as { full_name?: string | null }).full_name?.trim() || "門市人員";

  const { data, error: insertError } = await admin
    .from("store_messages")
    .insert({
      store_id: storeId,
      body: text,
      author_id: auth!.profile.id,
      author_name: staffName,
    })
    .select()
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "create", "store_messages", data.id, null, data, request as never);
  return NextResponse.json({ item: data }, { status: 201 });
}
