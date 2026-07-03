import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { getStaffOrders } from "@/lib/services/orderService";
import { getStaffStoreId } from "@/lib/services/pickupService";

export async function GET() {
  const { error: authError, auth } = await requireStaffOrAdmin();
  if (authError) return authError;

  const role = auth!.profile.role;
  if (role === "admin") {
    const { getAdminOrders } = await import("@/lib/services/orderService");
    const orders = await getAdminOrders();
    return NextResponse.json({ orders });
  }

  const storeId = await getStaffStoreId(auth!.profile.id);
  if (!storeId) {
    return NextResponse.json({ error: "尚未指派門市" }, { status: 403 });
  }

  const orders = await getStaffOrders(storeId);
  return NextResponse.json({ orders });
}
