import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ inquiries: [] });

  const admin = createAdminClient();
  // 一併帶出客戶勾選的商品明細，後台不用再點進去才看得到問了什麼。
  // 明細表是這次新增的，舊環境還沒 migrate 時這個 select 會失敗，
  // 所以失敗就退回原本的查法，不讓整頁掛掉。
  const withItems = await admin
    .from("corporate_inquiries")
    .select("*, corporate_inquiry_items(id, product_id, product_name, product_spec, quantity, note, sort_order)")
    .order("created_at", { ascending: false })
    .limit(100);

  let inquiries: Array<Record<string, unknown>>;
  if (withItems.error) {
    const { data, error: fetchError } = await admin
      .from("corporate_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    inquiries = (data ?? []) as Array<Record<string, unknown>>;
  } else {
    inquiries = (withItems.data ?? []) as Array<Record<string, unknown>>;
  }

  // 已開過的報價單一次查完（不要每列再打一次 API），讓後台看得出哪幾張已經回過價。
  const ids = inquiries.map((row) => String(row.id)).filter(Boolean);
  if (ids.length > 0) {
    const { data: quotes } = await admin
      .from("quotations")
      .select("id, quote_number, status, total_amount, corporate_inquiry_id, created_at")
      .in("corporate_inquiry_id", ids)
      .order("created_at", { ascending: false });

    if (quotes?.length) {
      const byInquiry = new Map<string, Array<Record<string, unknown>>>();
      for (const q of quotes) {
        const key = String(q.corporate_inquiry_id);
        const list = byInquiry.get(key) ?? [];
        list.push(q);
        byInquiry.set(key, list);
      }
      inquiries = inquiries.map((row) => ({
        ...row,
        quotations: byInquiry.get(String(row.id)) ?? [],
      }));
    }
  }

  return NextResponse.json({ inquiries });
}
