import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * 客戶送出商品詢價單。
 *
 * 限會員使用——詢價要能追蹤、要能回覆，沒有帳號的話後續聯絡會很麻煩，
 * 也擋掉大部分的垃圾詢價。
 *
 * 寫進既有的 corporate_inquiries（source='product'），明細寫 corporate_inquiry_items，
 * 所以後台原本的詢價管理、狀態流程、轉報價單都能直接沿用。
 */

type IncomingItem = {
  product_id?: string;
  quantity?: number | string;
  note?: string | null;
};

const MAX_ITEMS = 50;

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) {
    return NextResponse.json(
      { error: "請先登入會員才能送出詢價單。" },
      { status: 401 }
    );
  }

  let body: {
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    company_name?: string;
    delivery_info?: string;
    preferred_contact_time?: string;
    message?: string;
    items?: IncomingItem[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const contactName = String(body.contact_name ?? "").trim();
  const contactPhone = String(body.contact_phone ?? "").trim();
  if (!contactName) return NextResponse.json({ error: "請填寫聯絡人姓名" }, { status: 400 });
  if (!contactPhone) return NextResponse.json({ error: "請填寫聯絡電話" }, { status: 400 });

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "請至少選擇一項商品" }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `一次最多詢價 ${MAX_ITEMS} 項，請分批送出` },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ inquiry: { id: "mock", items: items.length } }, { status: 201 });
  }

  const admin = createAdminClient();

  // 商品名稱與規格由伺服器自己查，不信任前端傳來的——否則客戶可以偽造品名。
  const ids = Array.from(
    new Set(items.map((i) => String(i.product_id ?? "").trim()).filter(Boolean))
  );
  if (ids.length === 0) {
    return NextResponse.json({ error: "請至少選擇一項商品" }, { status: 400 });
  }

  const { data: products, error: productError } = await admin
    .from("products")
    // 刻意不查 sales_mode：這裡用不到它（直接販售的商品客戶一樣可以問大量採購價），
    // 而還沒跑 migration 的環境查了會讓整支 API 掛掉。
    .select("id, name, package_spec, specifications, is_active")
    .in("id", ids);

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const byId = new Map((products ?? []).map((p) => [String(p.id), p]));
  const usable = ids.filter((id) => {
    const p = byId.get(id);
    return p && p.is_active !== false;
  });
  if (usable.length === 0) {
    return NextResponse.json(
      { error: "選取的商品都已下架，請重新挑選。" },
      { status: 400 }
    );
  }

  const { data: inquiry, error: insertError } = await admin
    .from("corporate_inquiries")
    .insert({
      user_id: auth!.profile.id,
      source: "product",
      company_name: String(body.company_name ?? "").trim() || "（個人）",
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: String(body.contact_email ?? "").trim() || null,
      inquiry_type: "bulk_order",
      delivery_info: String(body.delivery_info ?? "").trim() || null,
      preferred_contact_time: String(body.preferred_contact_time ?? "").trim() || null,
      message: String(body.message ?? "").trim() || "（商品詢價）",
      status: "open",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const rows = usable.map((id, index) => {
    const p = byId.get(id)!;
    const incoming = items.find((i) => String(i.product_id ?? "") === id);
    const qty = Number(incoming?.quantity ?? 1);
    return {
      inquiry_id: inquiry.id,
      product_id: id,
      product_name: String(p.name ?? ""),
      product_spec:
        (p.package_spec as string | null) ?? (p.specifications as string | null) ?? null,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      note: incoming?.note ? String(incoming.note).slice(0, 500) : null,
      sort_order: index,
    };
  });

  const { error: itemsError } = await admin.from("corporate_inquiry_items").insert(rows);
  if (itemsError) {
    // 明細寫不進去的話，整張詢價單就沒有意義，刪掉避免留下空單。
    await admin.from("corporate_inquiries").delete().eq("id", inquiry.id);
    // 還沒跑 migration 的環境是「表不存在」，給一句看得懂的，
    // 不要把 Postgres 的原始訊息丟給客戶。
    const missingTable = /corporate_inquiry_items|does not exist|schema cache/i.test(
      itemsError.message
    );
    return NextResponse.json(
      {
        error: missingTable
          ? "商品詢價功能尚未開通，請改用客服表單與我們聯絡。"
          : itemsError.message,
      },
      { status: missingTable ? 503 : 500 }
    );
  }

  const skipped = ids.length - usable.length;
  return NextResponse.json(
    {
      inquiry: { id: inquiry.id, item_count: rows.length },
      skipped,
      message:
        skipped > 0
          ? `已送出詢價單。有 ${skipped} 項商品已下架，未列入。`
          : "已送出詢價單，我們會盡快與你聯絡。",
    },
    { status: 201 }
  );
}
