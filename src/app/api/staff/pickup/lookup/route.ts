import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getStaffStoreId, lookupOrderByPickupToken } from "@/lib/services/pickupService";

export async function POST(request: Request) {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  const body = await request.json();
  const pickupToken = String(body.pickup_token ?? "").trim();
  if (!pickupToken) {
    return NextResponse.json({ error: "請提供取貨碼" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      order: {
        order_id: "mock",
        order_no: "GB000000",
        customer_name: "測試會員",
        phone_last_three: "123",
        items: [],
        total_amount: 0,
        payment_status: "unpaid",
        pickup_status: "pending",
        order_status: "awaiting_payment",
      },
    });
  }

  try {
    const staffStoreId = await getStaffStoreId(auth!.profile.id);
    const order = await lookupOrderByPickupToken(
      pickupToken,
      auth!.profile.id,
      auth!.profile.role === "admin" ? null : staffStoreId
    );
    if (!order) return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "查詢失敗" }, { status: 403 });
  }
}
