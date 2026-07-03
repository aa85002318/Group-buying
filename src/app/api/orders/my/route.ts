import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMyOrders } from "@/lib/services/orderService";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const orders = await getMyOrders(auth!.profile.id);
  return NextResponse.json({ orders });
}
