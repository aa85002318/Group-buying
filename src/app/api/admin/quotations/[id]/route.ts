import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calcQuotationTotals,
  normalizeDisplayOptions,
  type QuotationStatus,
} from "@/lib/admin/quotations";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  product_name: z.string().min(1),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  note: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const patchSchema = z.object({
  company_name: z.string().nullable().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  corporate_inquiry_id: z.string().uuid().nullable().optional(),
  discount_amount: z.number().min(0).optional(),
  shipping_fee: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  status: z
    .enum(["draft", "sent", "accepted", "expired", "converted", "cancelled"])
    .optional(),
  display_options: z.record(z.boolean()).optional(),
  items: z.array(itemSchema).optional(),
});

async function requireQuotationAdmin() {
  return requireRole(["admin", "customer_service", "store_manager"]);
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { error } = await requireQuotationAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from("quotations")
    .select("*, quotation_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "找不到報價單" }, { status: 404 });

  const items = Array.isArray(data.quotation_items)
    ? [...data.quotation_items].sort(
        (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      )
    : [];

  return NextResponse.json({
    quotation: {
      ...data,
      display_options: normalizeDisplayOptions(data.display_options),
      quotation_items: items,
    },
  });
}

export async function PATCH(request: Request, context: Ctx) {
  const { error, auth } = await requireQuotationAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const parsed = patchSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: old } = await admin.from("quotations").select("*").eq("id", id).maybeSingle();
    if (!old) return NextResponse.json({ error: "找不到報價單" }, { status: 404 });
    if (old.status === "converted") {
      return NextResponse.json({ error: "已轉單的報價單不可再修改" }, { status: 422 });
    }

    let itemsForTotals = parsed.items;
    if (!itemsForTotals) {
      const { data: existingItems } = await admin
        .from("quotation_items")
        .select("quantity, unit_price")
        .eq("quotation_id", id);
      itemsForTotals = (existingItems ?? []).map((i) => ({
        product_name: "",
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      }));
    }

    const discount =
      parsed.discount_amount != null ? parsed.discount_amount : Number(old.discount_amount);
    const shipping =
      parsed.shipping_fee != null ? parsed.shipping_fee : Number(old.shipping_fee);
    const totals = calcQuotationTotals(itemsForTotals, discount, shipping);

    const patch: Record<string, unknown> = { ...totals };
    if (parsed.company_name !== undefined) patch.company_name = parsed.company_name?.trim() || null;
    if (parsed.contact_name !== undefined) patch.contact_name = parsed.contact_name.trim();
    if (parsed.contact_phone !== undefined) {
      patch.contact_phone = parsed.contact_phone?.trim() || null;
    }
    if (parsed.contact_email !== undefined) {
      patch.contact_email = parsed.contact_email?.trim() || null;
    }
    if (parsed.tax_id !== undefined) patch.tax_id = parsed.tax_id?.trim() || null;
    if (parsed.address !== undefined) patch.address = parsed.address?.trim() || null;
    if (parsed.user_id !== undefined) patch.user_id = parsed.user_id;
    if (parsed.corporate_inquiry_id !== undefined) {
      patch.corporate_inquiry_id = parsed.corporate_inquiry_id;
    }
    if (parsed.notes !== undefined) patch.notes = parsed.notes?.trim() || null;
    if (parsed.valid_until !== undefined) patch.valid_until = parsed.valid_until || null;
    if (parsed.status !== undefined) patch.status = parsed.status as QuotationStatus;
    if (parsed.display_options !== undefined) {
      patch.display_options = normalizeDisplayOptions({
        ...normalizeDisplayOptions(old.display_options),
        ...parsed.display_options,
      });
    }

    const { data: updated, error: updErr } = await admin
      .from("quotations")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    if (parsed.items) {
      await admin.from("quotation_items").delete().eq("quotation_id", id);
      if (parsed.items.length) {
        const rows = parsed.items.map((item, index) => {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unit_price) || 0;
          return {
            quotation_id: id,
            product_id: item.product_id ?? null,
            product_name: item.product_name.trim(),
            sku: item.sku ?? null,
            barcode: item.barcode ?? null,
            unit: item.unit ?? null,
            quantity,
            unit_price: unitPrice,
            subtotal: Math.round(quantity * unitPrice * 100) / 100,
            sort_order: item.sort_order ?? index,
            note: item.note ?? null,
          };
        });
        const { error: itemsErr } = await admin.from("quotation_items").insert(rows);
        if (itemsErr) {
          return NextResponse.json({ error: itemsErr.message }, { status: 500 });
        }
      }
    }

    const { data: full } = await admin
      .from("quotations")
      .select("*, quotation_items(*)")
      .eq("id", id)
      .single();

    await logAudit(auth!.profile.id, "update", "quotation", id, old, full ?? updated, request as never);

    return NextResponse.json({
      quotation: {
        ...(full ?? updated),
        display_options: normalizeDisplayOptions((full ?? updated).display_options),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "更新失敗" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const { error, auth } = await requireQuotationAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: old } = await admin.from("quotations").select("*").eq("id", id).maybeSingle();
  if (!old) return NextResponse.json({ error: "找不到報價單" }, { status: 404 });
  if (old.status === "converted") {
    return NextResponse.json({ error: "已轉單的報價單不可刪除" }, { status: 422 });
  }

  const { error: delErr } = await admin.from("quotations").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "quotation", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
