import { NextResponse } from "next/server";
import { requireOpsAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildProfileUpdates, isPhoneTaken } from "@/lib/services/profileService";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireOpsAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: member, error: memberError } = await admin
    .from("profiles")
    .select(
      "id, email, phone, full_name, birthday, member_code, member_number, role, avatar_url, city, district, created_at, updated_at, store_credit_balance, is_active, admin_notes"
    )
    .eq("id", id)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "會員不存在" }, { status: 404 });
  }

  const [{ data: orders }, { count: orderCount }, { data: favorites }, { count: addressCount }, { count: carrierCount }] =
    await Promise.all([
      admin
        .from("orders")
        .select("id, order_number, status, total_amount, channel, group_buy_event_id, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      admin.from("orders").select("id", { count: "exact", head: true }).eq("user_id", id),
      admin
        .from("product_favorites")
        .select("id, product_id, created_at, products(id, name, is_active)")
        .eq("user_id", id)
        .limit(20),
      admin
        .from("member_addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
      admin
        .from("invoice_carriers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
    ]);

  // Carrier: only count + masked preview — never full carrier_code in admin detail list
  const { data: carriers } = await admin
    .from("invoice_carriers")
    .select("id, carrier_name, carrier_code, is_default, created_at")
    .eq("user_id", id);

  const maskedCarriers = (carriers ?? []).map((c) => {
    const code = c.carrier_code ?? "";
    const masked =
      code.length <= 4 ? "****" : `${code.slice(0, 2)}****${code.slice(-2)}`;
    return {
      id: c.id,
      carrier_name: c.carrier_name,
      carrier_code_masked: masked,
      is_default: c.is_default,
      created_at: c.created_at,
    };
  });

  let emailVerified = false;
  let lastSignInAt: string | null = null;
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(id);
    emailVerified = Boolean(authUser.user?.email_confirmed_at);
    lastSignInAt = authUser.user?.last_sign_in_at ?? null;
  } catch {
    /* ignore */
  }

  // Phone match with store_members — warn only, never auto-merge
  let storeMemberMatches: Array<{ id: string; phone: string; store_member_no: string | null; source: string; created_at: string }> = [];
  if (member.phone) {
    const digits = member.phone.replace(/\D/g, "");
    const { data: storeHits } = await admin
      .from("store_members")
      .select("id, phone, store_member_no, source, created_at")
      .or(`phone.eq.${member.phone},phone.eq.${digits}`)
      .limit(5);
    storeMemberMatches = storeHits ?? [];
  }

  const { data: audits } = await admin
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at")
    .eq("entity_type", "profile")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    member: {
      ...member,
      email_verified: emailVerified,
      last_sign_in_at: lastSignInAt,
    },
    app_orders: orders ?? [],
    app_order_count: orderCount ?? 0,
    favorites: favorites ?? [],
    address_count: addressCount ?? 0,
    carrier_count: carrierCount ?? 0,
    carriers_masked: maskedCarriers,
    benefit_count: 0,
    store_member_matches: storeMemberMatches,
    audit_logs: audits ?? [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireOpsAdmin();
  if (error) return error;

  const { id } = await params;
  let body: {
    role?: string;
    store_credit_balance?: number;
    full_name?: string;
    phone?: string;
    birthday?: string;
    email?: string;
    is_active?: boolean;
    admin_notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const profilePatch = buildProfileUpdates({
    full_name: body.full_name,
    phone: body.phone,
    birthday: body.birthday,
    email: body.email,
  });

  const updates: Record<string, unknown> = {};
  if (profilePatch.ok) {
    Object.assign(updates, profilePatch.updates);
  } else if (
    body.full_name !== undefined ||
    body.phone !== undefined ||
    body.birthday !== undefined ||
    body.email !== undefined
  ) {
    return NextResponse.json({ error: profilePatch.error }, { status: profilePatch.status ?? 400 });
  }

  if (body.role !== undefined) updates.role = body.role;
  if (body.store_credit_balance !== undefined) updates.store_credit_balance = body.store_credit_balance;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      member: { id, ...updates, updated_at: new Date().toISOString() },
    });
  }

  const admin = createAdminClient();

  if (typeof updates.phone === "string") {
    const taken = await isPhoneTaken(admin, updates.phone, id);
    if (taken) {
      return NextResponse.json({ error: "此手機號碼已被其他會員使用" }, { status: 409 });
    }
  }

  const { data: old } = await admin.from("profiles").select("*").eq("id", id).single();
  const { data, error: updateError } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (body.email && old?.email !== body.email) {
    await admin.auth.admin.updateUserById(id, { email: body.email.trim() });
  }

  const action =
    body.is_active === false
      ? "deactivate_member"
      : body.is_active === true && old?.is_active === false
        ? "reactivate_member"
        : "update_member";

  await logAudit(
    auth!.profile.id,
    action,
    "profile",
    id,
    sanitizeAuditPayload(old),
    sanitizeAuditPayload(data)
  );
  return NextResponse.json({ member: data });
}
