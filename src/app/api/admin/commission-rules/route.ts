import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockCommissionRules } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireRole("admin");
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ rules: mockCommissionRules });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("commission_rules")
    .select("*")
    .order("priority", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ rules: data });
}

export async function POST(request: Request) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const rule = { id: `rule-${Date.now()}`, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    mockCommissionRules.push(rule);
    return NextResponse.json({ rule }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("commission_rules").insert(body).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_commission_rule", "commission_rule", data.id, null, data);
  return NextResponse.json({ rule: data }, { status: 201 });
}
