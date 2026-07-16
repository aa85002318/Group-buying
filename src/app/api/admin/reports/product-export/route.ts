import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts, mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format") ?? "xlsx";

  if (!productId) {
    return NextResponse.json({ error: "請指定 productId" }, { status: 400 });
  }

  type Row = {
    order_number: string;
    status: string;
    created_at: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    member_name: string;
    member_email: string;
    product_name: string;
  };

  let rows: Row[] = [];
  let productName = "";

  const fromDate = from ? new Date(from) : null;
  const toDate = to
    ? (() => {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        return d;
      })()
    : null;

  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    if (fromDate && t < fromDate.getTime()) return false;
    if (toDate && t > toDate.getTime()) return false;
    return true;
  };

  if (!isSupabaseConfigured()) {
    const product = mockProducts.find((p) => p.id === productId);
    productName = product?.name ?? productId;

    for (const order of mockStore.orders) {
      if (!inRange(order.created_at)) continue;
      for (const item of mockStore.orderItems.filter(
        (i) => i.order_id === order.id && i.product_id === productId
      )) {
        rows.push({
          order_number: order.order_number,
          status: order.status,
          created_at: order.created_at,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          member_name: "",
          member_email: "",
          product_name: item.product_name,
        });
      }
    }
  } else {
    const admin = createAdminClient();
    const { data: product } = await admin.from("products").select("name").eq("id", productId).maybeSingle();
    productName = product?.name ?? productId;

    const { data, error: fetchError } = await admin
      .from("order_items")
      .select(
        "quantity, unit_price, subtotal, product_name, orders!inner(order_number, status, created_at, profiles!orders_user_id_fkey(full_name, email))"
      )
      .eq("product_id", productId);

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    rows = (data ?? [])
      .map((item) => {
        const order = item.orders as unknown as {
          order_number: string;
          status: string;
          created_at: string;
          profiles?: { full_name?: string; email?: string } | null;
        };
        return {
          order_number: order.order_number,
          status: order.status,
          created_at: order.created_at,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          member_name: order.profiles?.full_name ?? "",
          member_email: order.profiles?.email ?? "",
          product_name: item.product_name || productName,
        };
      })
      .filter((r) => inRange(r.created_at));
  }

  if (format !== "xlsx") {
    return NextResponse.json({ productName, from, to, rows });
  }

  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalAmount = rows.reduce((s, r) => s + r.subtotal, 0);

  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      商品: r.product_name,
      訂單編號: r.order_number,
      會員: r.member_name,
      Email: r.member_email,
      狀態: ORDER_STATUS_LABELS[r.status as keyof typeof ORDER_STATUS_LABELS] ?? r.status,
      數量: r.quantity,
      單價: r.unit_price,
      小計: r.subtotal,
      下單時間: r.created_at,
    }))
  );
  XLSX.utils.sheet_add_aoa(
    ws,
    [[], ["彙總", `數量合計 ${totalQty}`, `金額合計 ${totalAmount}`, `區間 ${from ?? "—"} ~ ${to ?? "—"}`]],
    { origin: -1 }
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "產品團購報表");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const safeName = encodeURIComponent(`product-report-${productName}.xlsx`);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="product-report.xlsx"; filename*=UTF-8''${safeName}`,
    },
  });
}
