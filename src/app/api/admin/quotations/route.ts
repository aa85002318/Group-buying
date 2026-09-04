import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calcQuotationTotals,
  DEFAULT_QUOTATION_DISPLAY_OPTIONS,
  nextQuoteNumber,
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

const bodySchema = z.object({
  company_name: z.string().nullable().optional(),
  contact_name: z.string().optional().default(""),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  corporate_inquiry_id: z.string().uuid().nullable().optional(),
  discount_amount: z.number().min(0).optional().default(0),
  shipping_fee: z.number().min(0).optional().default(0),
  notes: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  status: z
    .enum(["draft", "sent", "accepted", "expired", "converted", "cancelled"])
    .optional()
    .default("draft"),
  display_options: z.record(z.boolean()).optional(),
  items: z.array(itemSchema).optional().default([]),
});

async function requireQuotationAdmin() {
  return requireRole(["admin", "customer_service", "store_manager"]);
}

function mapItems(
  quotationId: string,
  items: z.infer<typeof itemSchema>[]
) {
  return items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return {
      quotation_id: quotationId,
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
}

export async function GET(request: Request) {
  const { error } = await requireQuotationAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ quotations: [], total: 0 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") ?? searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20) || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();
  let query = admin
    .from("quotations")
    .select("*, quotation_items(id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (search) {
    query = query.or(
      `quote_number.ilike.%${search}%,company_name.ilike.%${search}%,contact_name.ilike.%${search}%,contact_phone.ilike.%${search}%,contact_email.ilike.%${search}%`
    );
  }

  const { data, error: dbErr, count } = await query;
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  const quotations = (data ?? []).map((row) => ({
    ...row,
    display_options: normalizeDisplayOptions(row.display_options),
    item_count: Array.isArray(row.quotation_items) ? row.quotation_items.length : 0,
    quotation_items: undefined,
  }));

  return NextResponse.json({
    quotations,
    total: count ?? quotations.length,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireQuotationAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  try {
    const parsed = bodySchema.parse(await request.json());
    const admin = createAdminClient();
    const quoteNumber = await nextQuoteNumber(async (prefix) => {
      const { data } = await admin
        .from("quotations")
        .select("quote_number")
        .like("quote_number", `${prefix}%`);
      return (data ?? []).map((r) => String(r.quote_number));
    });

    const totals = calcQuotationTotals(
      parsed.items,
      parsed.discount_amount,
      parsed.shipping_fee
    );
    const display = normalizeDisplayOptions({
      ...DEFAULT_QUOTATION_DISPLAY_OPTIONS,
      ...(parsed.display_options ?? {}),
    });

    const { data: quote, error: insertErr } = await admin
      .from("quotations")
      .insert({
        quote_number: quoteNumber,
        company_name: parsed.company_name?.trim() || null,
        contact_name: parsed.contact_name?.trim() || "",
        contact_phone: parsed.contact_phone?.trim() || null,
        contact_email: parsed.contact_email?.trim() || null,
        tax_id: parsed.tax_id?.trim() || null,
        address: parsed.address?.trim() || null,
        user_id: parsed.user_id ?? null,
        corporate_inquiry_id: parsed.corporate_inquiry_id ?? null,
        ...totals,
        notes: parsed.notes?.trim() || null,
        valid_until: parsed.valid_until || null,
        status: parsed.status as QuotationStatus,
        created_by: auth!.profile.id,
        display_options: display,
      })
      .select()
      .single();

    if (insertErr || !quote) {
      return NextResponse.json({ error: insertErr?.message ?? "建立失敗" }, { status: 500 });
    }

    if (parsed.items.length) {
      const { error: itemsErr } = await admin
        .from("quotation_items")
        .insert(mapItems(quote.id, parsed.items));
      if (itemsErr) {
        await admin.from("quotations").delete().eq("id", quote.id);
        return NextResponse.json({ error: itemsErr.message }, { status: 500 });
      }
    }

    const { data: full } = await admin
      .from("quotations")
      .select("*, quotation_items(*)")
      .eq("id", quote.id)
      .single();

    await logAudit(
      auth!.profile.id,
      "create",
      "quotation",
      quote.id,
      null,
      full ?? quote,
      request as never
    );

    return NextResponse.json({
      quotation: {
        ...(full ?? quote),
        display_options: normalizeDisplayOptions((full ?? quote).display_options),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "建立失敗" },
      { status: 400 }
    );
  }
}
