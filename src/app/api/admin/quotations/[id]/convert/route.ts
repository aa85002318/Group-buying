import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/lib/utils";
import { generatePickupToken } from "@/lib/services/pickupService";
import { createPickupCodeForOrder } from "@/lib/services/pickupService";
import { normalizeDisplayOptions } from "@/lib/admin/quotations";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().uuid(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const { error, auth } = await requireRole(["admin", "customer_service", "store_manager"]);
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const { userId } = bodySchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: quote, error: qErr } = await admin
      .from("quotations")
      .select("*, quotation_items(*)")
      .eq("id", id)
      .maybeSingle();
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    if (!quote) return NextResponse.json({ error: "找不到報價單" }, { status: 404 });
    if (quote.status === "converted" && quote.converted_order_id) {
      return NextResponse.json(
        { error: "此報價單已轉過訂單", orderId: quote.converted_order_id },
        { status: 422 }
      );
    }

    const items = (Array.isArray(quote.quotation_items) ? quote.quotation_items : []) as Array<{
      product_id: string | null;
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      sort_order?: number | null;
    }>;
    if (!items.length) {
      return NextResponse.json({ error: "報價單沒有明細，無法轉單" }, { status: 422 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: "找不到指定會員，請先建立或綁定會員" }, { status: 422 });
    }

    const missingProduct = items.find((i) => !i.product_id);
    if (missingProduct) {
      return NextResponse.json(
        {
          error: `明細「${missingProduct.product_name}」未綁定商品主檔，請先改為選自商品主檔的項目再轉單`,
        },
        { status: 422 }
      );
    }

    const orderNumber = generateOrderNumber();
    const pickupToken = generatePickupToken();
    const noteParts = [
      `由報價單 ${quote.quote_number} 轉入`,
      quote.notes?.trim() || null,
    ].filter(Boolean);

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        order_no: orderNumber,
        pickup_token: pickupToken,
        payment_status: "unpaid",
        pickup_status: "pending",
        user_id: userId,
        status: "awaiting_payment",
        fulfillment_status: "pending_payment",
        subtotal: Number(quote.subtotal) || 0,
        discount_amount: Number(quote.discount_amount) || 0,
        shipping_fee: Number(quote.shipping_fee) || 0,
        store_credit_used: 0,
        total_amount: Number(quote.total_amount) || 0,
        notes: noteParts.join("\n"),
        customer_name: quote.contact_name || profile.full_name || null,
        customer_phone: quote.contact_phone || profile.phone || null,
        customer_email: quote.contact_email || profile.email || null,
        payment_method: "store_payment",
      })
      .select()
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: orderErr?.message ?? "建立訂單失敗" }, { status: 500 });
    }

    const orderItemsPayload = items
      .slice()
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((item) => ({
        order_id: order.id,
        product_id: item.product_id as string,
        product_name: item.product_name,
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        unit_price: Number(item.unit_price) || 0,
        subtotal: Number(item.subtotal) || 0,
      }));

    const { error: itemsErr } = await admin.from("order_items").insert(orderItemsPayload);
    if (itemsErr) {
      await admin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    try {
      await createPickupCodeForOrder(order.id, pickupToken);
    } catch {
      /* pickup code optional for quote conversion */
    }

    await admin.from("shipments").insert({
      order_id: order.id,
      method: "store_pickup",
      status: "pending",
      recipient_name: quote.contact_name || null,
      recipient_phone: quote.contact_phone || null,
      notes: "報價單轉單",
    });

    const { data: updatedQuote } = await admin
      .from("quotations")
      .update({
        status: "converted",
        converted_order_id: order.id,
        user_id: userId,
      })
      .eq("id", id)
      .select("*, quotation_items(*)")
      .single();

    await logAudit(
      auth!.profile.id,
      "convert",
      "quotation",
      id,
      quote,
      { order_id: order.id, quotation: updatedQuote },
      request as never
    );

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      quotation: updatedQuote
        ? {
            ...updatedQuote,
            display_options: normalizeDisplayOptions(updatedQuote.display_options),
          }
        : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "轉單失敗" },
      { status: 400 }
    );
  }
}
