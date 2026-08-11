import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/** Export member personal data package (JSON download). */
export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      exported_at: new Date().toISOString(),
      profile: { full_name: "示範會員" },
      addresses: [],
      orders: [],
      favorites: [],
      consents: [],
      subscriptions: null,
    });
  }

  const admin = createAdminClient();
  const userId = auth!.profile.id;

  const [
    profileRes,
    addressesRes,
    ordersRes,
    favoritesRes,
    consentsRes,
    subsRes,
    giftsRes,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single(),
    admin.from("member_addresses").select("*").eq("user_id", userId),
    admin
      .from("orders")
      .select("id, order_no, order_number, status, total_amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("favorites").select("*").eq("user_id", userId).limit(200),
    admin.from("member_legal_consents").select("*").eq("user_id", userId),
    admin
      .from("marketing_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("member_gift_claims")
      .select("id, status, gift_name, created_at, redeemed_at")
      .eq("member_id", userId)
      .limit(100),
  ]);

  // Soft-fail gifts if table missing
  const giftClaims = giftsRes.error ? [] : giftsRes.data ?? [];

  await admin.from("member_data_export_requests").insert({
    user_id: userId,
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  const profile = profileRes.data
    ? {
        ...profileRes.data,
        phone_change_code: undefined,
        pending_phone: undefined,
      }
    : null;

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    profile,
    addresses: addressesRes.data ?? [],
    orders: ordersRes.data ?? [],
    favorites: favoritesRes.error ? [] : favoritesRes.data ?? [],
    gift_claims: giftClaims,
    consents: consentsRes.data ?? [],
    subscriptions: subsRes.data ?? null,
  });
}
