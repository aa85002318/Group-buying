import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ benefits: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("member_benefits")
    .select("*")
    .order("updated_at", { ascending: false });

  if (fetchError) {
    if (fetchError.code === "42P01") return NextResponse.json({ benefits: [] });
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const benefitIds = (data ?? []).map((b) => b.id);
  let counts: Record<string, number> = {};
  if (benefitIds.length) {
    const { data: assignments } = await admin
      .from("member_benefit_assignments")
      .select("benefit_id")
      .in("benefit_id", benefitIds)
      .neq("status", "revoked");
    counts = (assignments ?? []).reduce((acc: Record<string, number>, row) => {
      acc[row.benefit_id] = (acc[row.benefit_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return NextResponse.json({
    benefits: (data ?? []).map((b) => ({ ...b, assignment_count: counts[b.id] ?? 0 })),
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "請填寫福利名稱" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ benefit: { id: `mock-${Date.now()}`, ...body, title } }, { status: 201 });
  }

  const admin = createAdminClient();
  const payload = {
    title,
    summary: body.summary?.trim() || null,
    description: body.description?.trim() || null,
    image_url: body.image_url?.trim() || null,
    usage_instructions: body.usage_instructions?.trim() || null,
    usage_location: body.usage_location?.trim() || null,
    status: body.status ?? "draft",
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
    created_by: auth!.profile.id,
    updated_by: auth!.profile.id,
  };

  const { data, error: insertError } = await admin
    .from("member_benefits")
    .insert(payload)
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "member_benefit", data.id, null, data, request as never);
  return NextResponse.json({ benefit: data }, { status: 201 });
}
