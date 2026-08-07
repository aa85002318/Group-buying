import { NextResponse } from "next/server";
import { requireAdmin, requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  legacyHoursText,
  normalizeStoreRow,
  type StoreWeeklyHours,
} from "@/lib/admin/store-profile";
import { assertCanWriteStore } from "@/lib/admin/store-access";
import { getStaffStoreId } from "@/lib/services/pickupService";

const PATCHABLE = new Set([
  "name",
  "code",
  "address",
  "phone",
  "email",
  "line_at",
  "description",
  "notes",
  "business_hours",
  "weekly_hours",
  "holidays",
  "pickup_hours",
  "map_url",
  "navigation_url",
  "latitude",
  "longitude",
  "line_url",
  "logo_url",
  "image_url",
  "cover_image_url",
  "social_links",
  "gallery",
  "announcements",
  "seo",
  "disclosure",
  "service_flags",
  "visibility",
  "services",
  "daily_highlights",
  "pickup_available",
  "sort_order",
  "is_default",
  "is_active",
]);

/** Fields only admin may change (store_staff blocked). */
const ADMIN_ONLY_FIELDS = new Set(["disclosure", "is_default", "seo", "is_active"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireStoreOps();
  if (error) return error;

  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ store: { id } });
  }

  const admin = createAdminClient();
  let { data, error: fetchError } = await admin.from("stores").select("*").eq("id", id).single();
  if (fetchError && /disclosure/i.test(fetchError.message)) {
    const fallback = await admin
      .from("stores")
      .select(
        "id,name,code,address,phone,email,line_at,description,notes,business_hours,weekly_hours,holidays,pickup_hours,map_url,navigation_url,latitude,longitude,line_url,logo_url,image_url,cover_image_url,social_links,gallery,announcements,seo,service_flags,visibility,services,daily_highlights,pickup_available,sort_order,is_default,is_active,created_at,updated_at"
      )
      .eq("id", id)
      .single();
    data = fallback.data;
    fetchError = fallback.error;
  }
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });
  return NextResponse.json({
    store: normalizeStoreRow(data as unknown as Record<string, unknown>),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const role = (auth!.profile as { role?: string }).role ?? "store_staff";
  const isAdmin = role === "admin";

  const { id } = await params;

  if (!isAdmin) {
    const staffStoreId = await getStaffStoreId(auth!.profile.id);
    if (!staffStoreId || staffStoreId !== id) {
      return NextResponse.json(
        { error: "僅可編輯所屬分店資訊" },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  for (const key of Array.from(PATCHABLE)) {
    if (body[key] === undefined) continue;
    if (!isAdmin && ADMIN_ONLY_FIELDS.has(key)) continue;
    updates[key] = body[key];
  }

  const writeGate = await assertCanWriteStore(auth!, id);
  if (!writeGate.ok) return writeGate.response;

  for (const key of [
    "name",
    "code",
    "address",
    "phone",
    "email",
    "line_at",
    "description",
    "notes",
    "business_hours",
    "pickup_hours",
    "map_url",
    "navigation_url",
    "line_url",
    "logo_url",
    "image_url",
    "cover_image_url",
  ]) {
    if (typeof updates[key] === "string") {
      const t = (updates[key] as string).trim();
      updates[key] = t || null;
    }
  }

  if (updates.map_url != null && updates.navigation_url === undefined) {
    updates.navigation_url = updates.map_url;
  }
  if (updates.navigation_url != null && updates.map_url === undefined) {
    updates.map_url = updates.navigation_url;
  }
  if (updates.cover_image_url != null && updates.image_url === undefined) {
    updates.image_url = updates.cover_image_url;
  }

  if (updates.weekly_hours && typeof updates.weekly_hours === "object") {
    if (updates.business_hours === undefined) {
      updates.business_hours = legacyHoursText(updates.weekly_hours as StoreWeeklyHours);
    }
  }

  if (updates.service_flags && typeof updates.service_flags === "object") {
    const flags = updates.service_flags as { pickup?: boolean };
    if (updates.pickup_available === undefined && typeof flags.pickup === "boolean") {
      updates.pickup_available = flags.pickup;
    }
  }

  if (typeof updates.latitude === "string") {
    updates.latitude = updates.latitude ? Number(updates.latitude) : null;
  }
  if (typeof updates.longitude === "string") {
    updates.longitude = updates.longitude ? Number(updates.longitude) : null;
  }
  if (typeof updates.sort_order === "string") {
    updates.sort_order = Number(updates.sort_order);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      {
        error: isAdmin
          ? "沒有可更新的欄位"
          : "沒有可更新的欄位（公司揭露／系統啟用設定僅管理員可改）",
      },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      store: normalizeStoreRow({ id, ...updates }),
    });
  }

  const admin = createAdminClient();
  if (updates.is_default === true) {
    await admin.from("stores").update({ is_default: false }).neq("id", id).eq("is_default", true);
  }

  const { data: old } = await admin.from("stores").select("*").eq("id", id).single();

  let updateResult = await admin
    .from("stores")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (updateResult.error && /disclosure/i.test(updateResult.error.message) && "disclosure" in updates) {
    const withoutDisclosure = { ...updates };
    delete withoutDisclosure.disclosure;
    updateResult = await admin
      .from("stores")
      .update({ ...withoutDisclosure, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
  }

  const { data, error: updateError } = updateResult;
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_store", "stores", id, old, data);
  return NextResponse.json({
    store: normalizeStoreRow(data as unknown as Record<string, unknown>),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("stores").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("stores")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "deactivate_store", "stores", id, old, data);
  return NextResponse.json({
    ok: true,
    store: normalizeStoreRow(data as unknown as Record<string, unknown>),
  });
}
