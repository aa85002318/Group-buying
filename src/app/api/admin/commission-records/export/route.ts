import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const records = isSupabaseConfigured()
    ? (
        await createAdminClient()
          .from("commission_records")
          .select("*")
          .order("created_at", { ascending: false })
      ).data ?? []
    : mockStore.commissions;

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(
      records.map((r) => ({
        訂單ID: r.order_id,
        推薦人: r.referrer_user_id,
        分潤金額: r.commission_amount,
        狀態: r.status,
        建立時間: r.created_at,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "分潤紀錄");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="commission-records.xlsx"',
      },
    });
  }

  return NextResponse.json({ records });
}
