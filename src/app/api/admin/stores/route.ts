import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockStores } from "@/lib/mock-data";
import {
  DEFAULT_SERVICE_FLAGS,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_VISIBILITY,
  DEFAULT_WEEKLY_HOURS,
  legacyHoursText,
  normalizeStoreRow,
  STORE_PROFILE_SELECT,
  type StoreWeeklyHours,
} from "@/lib/admin/store-profile";

function buildCreatePayload(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!name || !address) {
    return { error: "請填寫取貨點名稱與地址" as const };
  }

  const weekly_hours =
    body.weekly_hours && typeof body.weekly_hours === "object"
      ? (body.weekly_hours as StoreWeeklyHours)
      : { ...DEFAULT_WEEKLY_HOURS };

  const service_flags = {
    ...DEFAULT_SERVICE_FLAGS,
    ...(typeof body.service_flags === "object" && body.service_flags
      ? (body.service_flags as object)
      : {}),
  };

  const map_url =
    typeof body.map_url === "string"
      ? body.map_url.trim() || null
      : typeof body.navigation_url === "string"
        ? body.navigation_url.trim() || null
        : null;

  return {
    payload: {
      name,
      address,
      code: typeof body.code === "string" ? body.code.trim() || null : null,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      email: typeof body.email === "string" ? body.email.trim() || null : null,
      line_at: typeof body.line_at === "string" ? body.line_at.trim() || null : null,
      description:
        typeof body.description === "string" ? body.description.trim() || null : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      business_hours:
        typeof body.business_hours === "string" && body.business_hours.trim()
          ? body.business_hours.trim()
          : legacyHoursText(weekly_hours),
      weekly_hours,
      holidays: Array.isArray(body.holidays) ? body.holidays : [],
      pickup_hours:
        typeof body.pickup_hours === "string" ? body.pickup_hours.trim() || null : null,
      map_url,
      navigation_url: map_url,
      latitude: body.latitude != null && body.latitude !== "" ? Number(body.latitude) : null,
      longitude:
        body.longitude != null && body.longitude !== "" ? Number(body.longitude) : null,
      line_url: typeof body.line_url === "string" ? body.line_url.trim() || null : null,
      logo_url: typeof body.logo_url === "string" ? body.logo_url.trim() || null : null,
      image_url:
        typeof body.image_url === "string"
          ? body.image_url.trim() || null
          : typeof body.cover_image_url === "string"
            ? body.cover_image_url.trim() || null
            : null,
      cover_image_url:
        typeof body.cover_image_url === "string"
          ? body.cover_image_url.trim() || null
          : typeof body.image_url === "string"
            ? body.image_url.trim() || null
            : null,
      social_links: Array.isArray(body.social_links) ? body.social_links : DEFAULT_SOCIAL_LINKS,
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      announcements: Array.isArray(body.announcements) ? body.announcements : [],
      seo: typeof body.seo === "object" && body.seo ? body.seo : {},
      service_flags,
      visibility: {
        ...DEFAULT_VISIBILITY,
        ...(typeof body.visibility === "object" && body.visibility
          ? (body.visibility as object)
          : {}),
      },
      services: body.services ?? [],
      daily_highlights: body.daily_highlights ?? {},
      pickup_available:
        typeof body.pickup_available === "boolean"
          ? body.pickup_available
          : service_flags.pickup !== false,
      sort_order: body.sort_order != null ? Number(body.sort_order) : 0,
      is_default: body.is_default === true,
      is_active: body.is_active !== false,
    },
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      stores: mockStores.map((s) => normalizeStoreRow(s as unknown as Record<string, unknown>)),
    });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("stores")
    .select(STORE_PROFILE_SELECT)
    .order("sort_order", { ascending: true })
    .order("name");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const stores = (data ?? []).map((row) =>
    normalizeStoreRow(row as unknown as Record<string, unknown>)
  );

  // Lightweight card metrics (best-effort)
  try {
    const today = new Date().toISOString().slice(0, 10);
    const storeIds = stores.map((s) => s.id);
    if (storeIds.length) {
      const { data: orders } = await admin
        .from("orders")
        .select("store_id, pickup_store_id, created_at")
        .gte("created_at", `${today}T00:00:00`)
        .limit(2000);
      const orderCounts = new Map<string, number>();
      for (const o of orders ?? []) {
        const sid = (o.pickup_store_id || o.store_id) as string | null;
        if (!sid) continue;
        orderCounts.set(sid, (orderCounts.get(sid) ?? 0) + 1);
      }

      const { data: inv } = await admin
        .from("store_inventory")
        .select("store_id, quantity")
        .in("store_id", storeIds)
        .limit(5000);
      const invCounts = new Map<string, number>();
      for (const row of inv ?? []) {
        const sid = row.store_id as string;
        invCounts.set(sid, (invCounts.get(sid) ?? 0) + Number(row.quantity ?? 0));
      }

      for (const s of stores) {
        s.today_orders = orderCounts.get(s.id) ?? 0;
        s.inventory_qty = invCounts.get(s.id) ?? 0;
      }
    }
  } catch {
    // metrics optional
  }

  return NextResponse.json({ stores });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const built = buildCreatePayload(body);
  if ("error" in built && built.error) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }
  const payload = built.payload!;

  if (!isSupabaseConfigured()) {
    const store = normalizeStoreRow({
      id: `store-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ store }, { status: 201 });
  }

  const admin = createAdminClient();
  if (payload.is_default) {
    await admin.from("stores").update({ is_default: false }).eq("is_default", true);
  }

  const { data, error: insertError } = await admin.from("stores").insert(payload).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_store", "stores", data.id, null, data);
  return NextResponse.json(
    { store: normalizeStoreRow(data as unknown as Record<string, unknown>) },
    { status: 201 }
  );
}
