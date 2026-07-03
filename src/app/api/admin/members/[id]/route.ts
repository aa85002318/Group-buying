import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildProfileUpdates, isPhoneTaken } from "@/lib/services/profileService";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  let body: {
    role?: string;
    store_credit_balance?: number;
    full_name?: string;
    phone?: string;
    birthday?: string;
    email?: string;
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

  await logAudit(auth!.profile.id, "update_member", "profile", id, old, data);
  return NextResponse.json({ member: data });
}
