import { NextResponse } from "next/server";
import { requireGiftAuditRead } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error, auth } = await requireGiftAuditRead();
  if (error) return error;

  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") ?? "pending").trim();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [] });
  }

  const admin = createAdminClient();
  let q = admin
    .from("gift_reversal_requests")
    .select(
      "*, member_gift_claims(id, redemption_number, redemption_code, status, redeemed_at, redeemed_store_name_snapshot, gift_campaigns(name, gift_name), profiles:member_id(full_name, member_number)), requester:requested_by(full_name, role), reviewer:reviewed_by(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  if (auth!.profile.role === "store_manager") {
    const storeId = await getStaffStoreId(auth!.profile.id);
    if (storeId) q = q.eq("store_id", storeId);
  }

  const { data, error: qErr } = await q;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ requests: data ?? [] });
}
