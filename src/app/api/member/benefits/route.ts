import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { resolveBenefitDisplayStatus } from "@/lib/benefits/status";
import type { MemberBenefitAssignment } from "@/lib/types/database";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ benefits: [] });
  }

  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("member_benefit_assignments")
    .select("*, member_benefits(*)")
    .eq("user_id", auth!.profile.id)
    .neq("status", "revoked")
    .order("assigned_at", { ascending: false });

  if (fetchError) {
    if (fetchError.code === "42P01") return NextResponse.json({ benefits: [] });
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
  }

  const benefits = ((data ?? []) as MemberBenefitAssignment[]).map((row) => {
    const displayStatus = resolveBenefitDisplayStatus(row, row.member_benefits);
    return { ...row, displayStatus };
  });

  return NextResponse.json({ benefits });
}
