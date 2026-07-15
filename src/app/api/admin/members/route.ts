import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProfile } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

const mockMembers = [
  { ...mockProfile, store_credit_balance: 200 },
  {
    id: "00000000-0000-4000-8000-000000000099",
    email: "aa85002318@gmail.com",
    phone: "0912345678",
    full_name: "系統管理員",
    birthday: "1985-01-01",
    member_code: "ADMIN01",
    role: "admin" as const,
    avatar_url: null,
    referrer_user_id: null,
    store_id: null,
    store_credit_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  const { error } = await requireAdmin();
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
    .select("id, email, phone, full_name, birthday, member_code, role, store_id, created_at, updated_at, store_credit_balance")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,member_code.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const verifiedMap = new Map<string, boolean>();
  let page = 1;
  for (;;) {
    const { data: authPage, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (authError) break;
    for (const user of authPage.users) {
      verifiedMap.set(user.id, Boolean(user.email_confirmed_at));
    }
    if (authPage.users.length < 200) break;
    page += 1;
    if (page > 50) break;
  }

  const members = (data ?? []).map((m) => ({
    ...m,
    email_verified: verifiedMap.get(m.id) ?? false,
  }));

  return NextResponse.json({ members });
}
