import { NextResponse } from "next/server";
import { requireGiftAuditRead } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireGiftAuditRead();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaign_id");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ vouchers: [] });
  }

  const admin = createAdminClient();
  let q = admin
    .from("member_gift_claims")
    .select(
      "id, status, quantity, claimed_at, expires_at, redeemed_at, redemption_code, redemption_number, redeemed_store_name_snapshot, gift_campaigns(name, gift_name, campaign_type), profiles:member_id(full_name, member_number, phone)"
    )
    .order("claimed_at", { ascending: false })
    .limit(300);

  if (status) q = q.eq("status", status);
  if (campaignId) q = q.eq("campaign_id", campaignId);

  const { data, error: qErr } = await q;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({ vouchers: data ?? [] });
}
