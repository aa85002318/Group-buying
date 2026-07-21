import { NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProfile } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

const mockMembers = [
  {
    ...mockProfile,
    member_number: "CM000001",
    store_credit_balance: 200,
    is_active: true,
    app_order_count: 2,
    favorite_count: 1,
    email_verified: true,
  },
];

/**
 * App 會員列表 — 僅 profiles + App 訂單統計。
 * 不含 POS／門市消費、不回傳完整發票載具號碼。
 */
export async function GET(request: Request) {
  const { error } = await requireOpsAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  if (!isSupabaseConfigured()) {
    let members = [...mockMembers];
    if (search) {
      const q = search.toLowerCase();
      members = members.filter(
        (m) =>
          m.email?.toLowerCase().includes(q) ||
          m.full_name?.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ members });
  }

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select(
      "id, email, phone, full_name, birthday, member_code, member_number, role, store_id, created_at, updated_at, store_credit_balance, is_active, admin_notes"
    )
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,member_code.ilike.%${search}%,member_number.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const ids = (data ?? []).map((m) => m.id);

  const orderCountMap = new Map<string, number>();
  const favoriteCountMap = new Map<string, number>();

  if (ids.length > 0) {
    const { data: orders } = await admin.from("orders").select("user_id").in("user_id", ids);
    for (const o of orders ?? []) {
      orderCountMap.set(o.user_id, (orderCountMap.get(o.user_id) ?? 0) + 1);
    }
    const { data: favorites } = await admin
      .from("product_favorites")
      .select("user_id")
      .in("user_id", ids);
    for (const f of favorites ?? []) {
      favoriteCountMap.set(f.user_id, (favoriteCountMap.get(f.user_id) ?? 0) + 1);
    }
  }

  const verifiedMap = new Map<string, boolean>();
  const lastSignInMap = new Map<string, string | null>();
  let page = 1;
  for (;;) {
    const { data: authPage, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (authError) break;
    for (const user of authPage.users) {
      verifiedMap.set(user.id, Boolean(user.email_confirmed_at));
      lastSignInMap.set(user.id, user.last_sign_in_at ?? null);
    }
    if (authPage.users.length < 200) break;
    page += 1;
    if (page > 50) break;
  }

  const members = (data ?? []).map((m) => ({
    ...m,
    email_verified: verifiedMap.get(m.id) ?? false,
    last_sign_in_at: lastSignInMap.get(m.id) ?? null,
    app_order_count: orderCountMap.get(m.id) ?? 0,
    favorite_count: favoriteCountMap.get(m.id) ?? 0,
    benefit_count: 0,
  }));

  return NextResponse.json({ members });
}
