import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrderById } from "@/lib/services/orderService";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const order = await getOrderById(id, auth!.profile.id);
  if (!order) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
  return NextResponse.json({ order });
}
