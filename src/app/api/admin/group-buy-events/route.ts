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
    linked_product_id: body.linked_product_id || null,
    start_at: body.start_at,
    end_at: body.end_at,
    status: body.status ?? "draft",
    store_id: body.store_id,
    leader_user_id: body.leader_user_id,
    short_title: body.short_title ?? null,
    sort_order: body.sort_order ?? 0,
    is_featured: body.is_featured ?? false,
    expected_arrival_at: body.expected_arrival_at || null,
    pickup_start_at: body.pickup_start_at || null,
    pickup_end_at: body.pickup_end_at || null,
    original_price: body.original_price ?? null,
    group_price: body.group_price ?? null,
    member_group_price: body.member_group_price ?? null,
    min_qty: body.min_qty ?? null,
    max_qty_per_user: body.max_qty_per_user ?? null,
    threshold_type: body.threshold_type ?? "none",
    threshold_value: body.threshold_value ?? null,
    show_progress: body.show_progress ?? false,
    show_reached_badge: body.show_reached_badge ?? true,
    allow_under_threshold: body.allow_under_threshold ?? true,
    fulfillment_options: Array.isArray(body.fulfillment_options)
      ? body.fulfillment_options
      : [],
    manual_tags: Array.isArray(body.manual_tags) ? body.manual_tags.slice(0, 2) : [],
    stats_mode: body.stats_mode ?? "orders",
    category_label: body.category_label ?? null,
    virtual_sold_qty: Math.max(0, Number(body.virtual_sold_qty ?? 0)),
    show_virtual_sales_label: body.show_virtual_sales_label !== false,
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
  let { data, error: insertError } = await admin
    .from("group_buy_events")
    .insert(payload)
    .select()
    .single();

  if (insertError && /column|does not exist/i.test(insertError.message)) {
    const core = {
      title: payload.title,
      description: payload.description,
      banner_url: payload.banner_url,
      banner_aspect_ratio: payload.banner_aspect_ratio,
      is_homepage_featured: payload.is_homepage_featured,
      homepage_sort_order: payload.homepage_sort_order,
      linked_product_id: payload.linked_product_id,
      start_at: payload.start_at,
      end_at: payload.end_at,
      status: payload.status,
      store_id: payload.store_id,
      leader_user_id: payload.leader_user_id,
    };
    ({ data, error: insertError } = await admin.from("group_buy_events").insert(core).select().single());
  }

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_group_buy", "group_buy_event", data.id, null, data);
  return NextResponse.json({ event: data }, { status: 201 });
}
