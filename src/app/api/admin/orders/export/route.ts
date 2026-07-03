import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const { error } = await requireStaffOrAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "xlsx";

  const orders = isSupabaseConfigured()
    ? (
        await createAdminClient()
          .from("orders")
          .select("order_number, status, total_amount, subtotal, discount, created_at, profiles!orders_user_id_fkey(full_name, email)")
          .order("created_at", { ascending: false })
      ).data ?? []
    : mockStore.orders;

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(
      orders.map((o) => {
        const profile = (o as { profiles?: { full_name?: string; email?: string } }).profiles;
        return {
          訂單編號: o.order_number,
          會員: profile?.full_name ?? "",
          Email: profile?.email ?? "",
          狀態: ORDER_STATUS_LABELS[o.status] ?? o.status,
          小計: o.subtotal,
          折扣: (o as { discount?: number }).discount ?? 0,
          總額: o.total_amount,
          建立時間: o.created_at,
        };
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "訂單");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="orders.xlsx"',
      },
    });
  }

  return NextResponse.json({ orders });
}
