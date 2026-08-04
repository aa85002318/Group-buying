import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStores } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeStoreRow,
  STORE_PROFILE_SELECT,
  type StoreAnnouncement,
  type StoreProfile,
} from "@/lib/admin/store-profile";

function activeAnnouncements(items: StoreAnnouncement[]): StoreAnnouncement[] {
  const now = Date.now();
  return items.filter((a) => {
    if (!a.visible || !a.body?.trim()) return false;
    if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
    if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
    return true;
  });
}

function channelVisible(store: StoreProfile, channel: string | null): boolean {
  if (channel === "app") return store.visibility.app !== false;
  if (channel === "pwa") return store.visibility.pwa !== false;
  return store.visibility.website !== false;
}

function publicStore(row: StoreProfile) {
  const v = row.visibility;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    address: row.address,
    phone: v.show_phone === false ? null : row.phone,
    email: v.show_email === false ? null : row.email,
    line_at: row.line_at,
    description: v.show_description === false ? null : row.description,
    notes: row.notes,
    business_hours: v.show_hours === false ? null : row.business_hours,
    weekly_hours: v.show_hours === false ? null : row.weekly_hours,
    holidays: v.show_hours === false ? [] : row.holidays,
    pickup_hours: v.show_hours === false ? null : row.pickup_hours,
    map_url: v.show_map === false ? null : row.map_url ?? row.navigation_url,
    navigation_url: v.show_map === false ? null : row.navigation_url ?? row.map_url,
    latitude: v.show_map === false ? null : row.latitude,
    longitude: v.show_map === false ? null : row.longitude,
    line_url: row.line_url,
    logo_url: row.logo_url,
    image_url: row.cover_image_url ?? row.image_url,
    cover_image_url: row.cover_image_url ?? row.image_url,
    social_links:
      v.show_social === false
        ? []
        : row.social_links.filter((s) => s.visible && s.url.trim()),
    gallery: v.show_gallery === false ? [] : row.gallery,
    announcements:
      v.show_announcements === false ? [] : activeAnnouncements(row.announcements),
    seo: row.seo,
    service_flags: row.service_flags,
    pickup_available: row.pickup_available,
    sort_order: row.sort_order,
    is_default: row.is_default,
    is_active: row.is_active,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const slug = searchParams.get("slug");

  if (!isSupabaseConfigured()) {
    const stores = mockStores
      .filter((s) => s.is_active)
      .map((s) => normalizeStoreRow(s as unknown as Record<string, unknown>))
      .filter((s) => channelVisible(s, channel))
      .map(publicStore);
    return NextResponse.json({ stores });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select(STORE_PROFILE_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let stores = (data ?? [])
    .map((row) => normalizeStoreRow(row as unknown as Record<string, unknown>))
    .filter((s) => channelVisible(s, channel));

  if (slug) {
    stores = stores.filter((s) => s.seo?.slug === slug);
  }

  return NextResponse.json({ stores: stores.map(publicStore) });
}
