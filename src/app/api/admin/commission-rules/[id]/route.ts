import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockCommissionRules } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("admin");
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const rule = mockCommissionRules.find((r) => r.id === id);
    if (!rule) return NextResponse.json({ error: "規則不存在" }, { status: 404 });
    return NextResponse.json({ rule });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin.from("commission_rules").select("*").eq("id", id).single();
  if (fetchError) return NextResponse.json({ error: "規則不存在" }, { status: 404 });
  return NextResponse.json({ rule: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const idx = mockCommissionRules.findIndex((r) => r.id === id);
    if (idx < 0) return NextResponse.json({ error: "規則不存在" }, { status: 404 });
    mockCommissionRules[idx] = { ...mockCommissionRules[idx], ...body };
    return NextResponse.json({ rule: mockCommissionRules[idx] });
  }

  const admin = createAdminClient();
  const { data, error: updateError } = await admin.from("commission_rules").update(body).eq("id", id).select().single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "update_commission_rule", "commission_rule", id, null, data);
  return NextResponse.json({ rule: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const idx = mockCommissionRules.findIndex((r) => r.id === id);
    if (idx < 0) return NextResponse.json({ error: "規則不存在" }, { status: 404 });
    mockCommissionRules.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("commission_rules").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete_commission_rule", "commission_rule", id, null, null);
  return NextResponse.json({ success: true });
}
