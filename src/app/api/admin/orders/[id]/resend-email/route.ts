import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { sendOrderEmailByType, type OrderEmailType } from "@/lib/email/notifications";

const ALLOWED: OrderEmailType[] = ["confirmation", "unpaid", "cancelled", "arrival"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireStaffOrAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const type = body.type as OrderEmailType;
  const reason = typeof body.reason === "string" ? body.reason : undefined;

  if (!ALLOWED.includes(type)) {
    return NextResponse.json(
      { error: "請指定信件類型：confirmation / unpaid / cancelled / arrival" },
      { status: 400 }
    );
  }

  const result = await sendOrderEmailByType(id, type, { reason });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "寄送失敗" }, { status: 400 });
  }

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, `resend_order_email_${type}`, "order", id, null, {
      type,
      resend_id: result.id ?? null,
    });
  }

  return NextResponse.json({ ok: true, id: result.id ?? null });
}
