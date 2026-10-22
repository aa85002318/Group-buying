import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 單張詢價單（含客戶勾選的商品明細與已開過的報價單）。
 *
 * 報價單編輯頁用 ?inquiry=<id> 進來時會打這支，把聯絡資料與商品帶進去，
 * 後台就不用自己重打一次。
 */
export async function GET(_request: Request, context: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  // 明細表是這次新增的，舊環境還沒 migrate 時這個 select 會失敗，所以失敗就退回原本的查法。
  const withItems = await admin
    .from("corporate_inquiries")
    .select(
      "*, corporate_inquiry_items(id, product_id, product_name, product_spec, quantity, note, sort_order)"
    )
    .eq("id", id)
    .maybeSingle();

  let inquiry = withItems.error ? null : withItems.data;
  if (withItems.error) {
    const fallback = await admin
      .from("corporate_inquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
    inquiry = fallback.data;
  }

  if (!inquiry) return NextResponse.json({ error: "找不到詢價單" }, { status: 404 });

  // 報價單需要 SKU／條碼／單位／單價，明細只存了名稱與規格快照，
  // 所以這裡再補查一次商品現況，轉報價單時後台就不用自己打。
  const items = (inquiry as { corporate_inquiry_items?: Array<Record<string, unknown>> })
    .corporate_inquiry_items;
  if (Array.isArray(items) && items.length > 0) {
    const productIds = Array.from(
      new Set(items.map((i) => String(i.product_id ?? "")).filter(Boolean))
    );
    if (productIds.length > 0) {
      const { data: products } = await admin
        .from("products")
        .select("id, name, sku, barcode, unit, price, sale_price")
        .in("id", productIds);
      const byId = new Map((products ?? []).map((p) => [String(p.id), p]));
      (inquiry as { corporate_inquiry_items?: Array<Record<string, unknown>> })
        .corporate_inquiry_items = items.map((item) => {
        const p = byId.get(String(item.product_id ?? ""));
        return {
          ...item,
          product: p
            ? {
                sku: p.sku ?? null,
                barcode: p.barcode ?? null,
                unit: p.unit ?? null,
                // 有特價就用特價當報價起點，後台還是可以自己改。
                price: Number(p.sale_price ?? p.price) || 0,
              }
            : null,
        };
      });
    }
  }

  // 已經開過的報價單，避免後台重複開單。
  const { data: quotations } = await admin
    .from("quotations")
    .select("id, quote_number, status, total_amount, created_at")
    .eq("corporate_inquiry_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ inquiry, quotations: quotations ?? [] });
}

export async function PATCH(request: Request, context: Ctx) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const { id } = await context.params;
  const body = await request.json();

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("corporate_inquiries")
    .update({ status: body.status })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_corporate_inquiry", "corporate_inquiry", id, null, data);
  return NextResponse.json({ inquiry: data });
}
