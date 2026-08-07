import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayISO } from "@/lib/admin/store-ops";

async function resolveStoreId(
  admin: ReturnType<typeof createAdminClient>,
  storeId?: string | null
) {
  if (storeId) return storeId;
  const { data } = await admin
    .from("stores")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ messages: [] });
  }

  const url = new URL(request.url);
  const day = url.searchParams.get("date") || todayISO();
  const admin = createAdminClient();
  const storeId = await resolveStoreId(admin, url.searchParams.get("store_id"));

  // Use Taiwan calendar day bounds in UTC+8
  const dayStart = `${day}T00:00:00+08:00`;
  const dayEnd = `${day}T23:59:59.999+08:00`;

  let query = admin
    .from("store_messages")
    .select("*")
    .gte("created_at", dayStart)
    .lte("created_at", dayEnd)
    .order("created_at", { ascending: true })
    .limit(100);

  if (storeId) query = query.eq("store_id", storeId);

  const { data, error: qError } = await query;
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({
    messages: data ?? [],
    store_id: storeId,
    date: day,
  });
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
  const storeId = await resolveStoreId(admin, body.store_id);
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
