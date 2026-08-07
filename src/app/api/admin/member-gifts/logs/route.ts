import { NextResponse } from "next/server";
import { requireGiftAuditRead } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireGiftAuditRead();
  if (error) return error;

  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaign_id");
  const result = url.searchParams.get("result");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [] });
  }

  const admin = createAdminClient();
  let q = admin
    .from("gift_redemption_logs")
    .select(
      "id, action, result, failure_reason, created_at, store_id, staff_id, claim_id, campaign_id, member_id, meta"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (campaignId) q = q.eq("campaign_id", campaignId);
  if (result) q = q.eq("result", result);

  const { data, error: qErr } = await q;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const logs = data ?? [];
  if (url.searchParams.get("format") === "csv") {
    const header = [
      "id",
      "action",
      "result",
      "failure_reason",
      "created_at",
      "campaign_id",
      "claim_id",
      "member_id",
      "store_id",
      "staff_id",
    ];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [
      header.join(","),
      ...logs.map((row) =>
        header.map((k) => escape((row as Record<string, unknown>)[k])).join(",")
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gift-redemption-logs.csv"`,
      },
    });
  }

  return NextResponse.json({ logs });
}
