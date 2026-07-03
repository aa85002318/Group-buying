import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ events: getMockGroupBuyEventsWithProducts() });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("group_buy_events")
    .select("*, group_buy_products(*, products(name, price)), stores(name)")
    .order("start_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  const payload = {
    title: body.title,
    description: body.description,
    banner_url: body.banner_url ?? null,
    banner_aspect_ratio: body.banner_aspect_ratio ?? "16:9",
    is_homepage_featured: body.is_homepage_featured ?? false,
    homepage_sort_order: body.homepage_sort_order ?? 0,
    start_at: body.start_at,
    end_at: body.end_at,
    status: body.status ?? "draft",
    store_id: body.store_id,
    leader_user_id: body.leader_user_id,
  };

  if (!isSupabaseConfigured()) {
    const event = {
      id: `gb-${Date.now()}`,
      ...payload,
      leader_user_id: payload.leader_user_id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json({ event }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("group_buy_events")
    .insert(payload)
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_group_buy", "group_buy_event", data.id, null, data);
  return NextResponse.json({ event: data }, { status: 201 });
}
