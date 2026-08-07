import { NextResponse } from "next/server";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireGiftMarketing();
  if (error) return error;

  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return new NextResponse("id,status\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="member-gifts-${id}.csv"`,
      },
    });
  }

  const admin = createAdminClient();
  const { data: claims } = await admin
    .from("member_gift_claims")
    .select(
      "id, status, quantity, claimed_at, expires_at, redeemed_at, redemption_number, redeemed_store_name_snapshot, redeemed_staff_code_snapshot, source_order_id, profiles:member_id(full_name, member_number)"
    )
    .eq("campaign_id", id)
    .order("claimed_at", { ascending: false });

  const header = [
    "claim_id",
    "member_name",
    "member_number",
    "status",
    "quantity",
    "claimed_at",
    "expires_at",
    "redeemed_at",
    "redemption_number",
    "store",
    "staff_code",
    "order_id",
  ];

  const lines = [header.join(",")];
  for (const c of claims ?? []) {
    const profile = c.profiles as { full_name?: string; member_number?: string } | null;
    lines.push(
      [
        c.id,
        profile?.full_name,
        profile?.member_number,
        c.status,
        c.quantity,
        c.claimed_at,
        c.expires_at,
        c.redeemed_at,
        c.redemption_number,
        c.redeemed_store_name_snapshot,
        c.redeemed_staff_code_snapshot,
        c.source_order_id,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return new NextResponse("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="member-gifts-${id}.csv"`,
    },
  });
}
