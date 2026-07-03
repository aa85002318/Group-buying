import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { getOrderByPickupToken, getStaffStoreId } from "@/lib/services/pickupService";

export async function GET(_request: Request, { params }: { params: Promise<{ pickup_token: string }> }) {
  const { error: authError, auth } = await requireStaffOrAdmin();
  if (authError) return authError;

  const { pickup_token } = await params;
  const staffStoreId =
    auth!.profile.role === "store_staff" ? await getStaffStoreId(auth!.profile.id) : null;

  try {
    const order = await getOrderByPickupToken(pickup_token, auth!.profile.id, staffStoreId);
    if (!order) {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "查詢失敗" },
      { status: 403 }
    );
  }
}
