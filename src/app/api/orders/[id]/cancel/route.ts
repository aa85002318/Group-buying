import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrderById } from "@/lib/services/orderService";
import { canonicalizeStatus } from "@/lib/fulfillment/status";
import { transitionOrderStatus } from "@/lib/fulfillment/transitions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const order = await getOrderById(id, auth!.profile.id);
  if (!order) return NextResponse.json({ error: "訂單不存在" }, { status: 404 });

  const status = canonicalizeStatus(order.status, order.fulfillment_status);
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : null;

  try {
    const to = status === "pending_payment" || status === "payment_failed" ? "cancelled" : "cancel_requested";
    await transitionOrderStatus({
      orderId: id,
      to,
      actorId: auth!.profile.id,
      actorRole: "member",
      note: reason ?? "會員申請取消",
      request,
    });
    return NextResponse.json({ ok: true, status: to });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "無法取消" },
      { status: 400 }
    );
  }
}
