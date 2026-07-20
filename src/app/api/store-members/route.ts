import { NextResponse } from "next/server";
import { requireStaffOrAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createStoreMember,
  findOnlinePhoneMatch,
  normalizePhone,
} from "@/lib/services/storeMemberService";

export async function GET(request: Request) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ members: [] });
  }

  const phone = new URL(request.url).searchParams.get("phone");
  const admin = createAdminClient();
  let query = admin.from("store_members").select("*").order("created_at", { ascending: false });
  if (phone) query = query.eq("phone", normalizePhone(phone));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireStaffOrAdmin();
  if (authError) return authError;

  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!phone) return NextResponse.json({ error: "電話為必填" }, { status: 400 });

  // Reject any attempt to store PII beyond phone
  if (body.name || body.email || body.address || body.full_name) {
    return NextResponse.json(
      { error: "門市會員僅保留電話，不得寫入姓名／Email／地址" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    const match = { matched: false, online_profile_id: null, message: null };
    return NextResponse.json(
      {
        member: {
          id: `sm-${Date.now()}`,
          phone: normalizePhone(phone),
          store_member_no: body.store_member_no ?? null,
          source: body.source ?? "manual",
          notes: body.notes ?? null,
        },
        phoneMatch: match,
      },
      { status: 201 }
    );
  }

  const { member, error, phoneMatch } = await createStoreMember({
    phone,
    store_member_no: body.store_member_no ?? null,
    store_id: body.store_id ?? null,
    source: body.source ?? "manual",
    notes: body.notes ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "create",
    "store_member",
    member?.id ?? null,
    null,
    { phone: member?.phone, store_member_no: member?.store_member_no },
    request as never
  );

  return NextResponse.json({ member, phoneMatch }, { status: 201 });
}

/** Check phone match without creating */
export async function PUT(request: Request) {
  const { error: authError } = await requireStaffOrAdmin();
  if (authError) return authError;

  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!phone) return NextResponse.json({ error: "電話為必填" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ phoneMatch: { matched: false } });
  }

  const phoneMatch = await findOnlinePhoneMatch(phone);
  return NextResponse.json({ phoneMatch });
}
