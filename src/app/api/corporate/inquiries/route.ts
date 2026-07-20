import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`corporate:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "送出過於頻繁，請稍後再試" }, { status: 429 });
  }

  const body = await request.json();
  const companyName = body.company_name?.trim();
  const contactName = body.contact_name?.trim();
  const message = body.message?.trim();

  if (!companyName || !contactName || !message) {
    return NextResponse.json({ error: "請填寫公司名稱、聯絡人與需求說明" }, { status: 400 });
  }

  const auth = await getAuthUser();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      inquiry: {
        id: `mock-${Date.now()}`,
        company_name: companyName,
        status: "open",
      },
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("corporate_inquiries")
    .insert({
      user_id: auth?.profile.id ?? null,
      company_name: companyName,
      contact_name: contactName,
      contact_phone: body.contact_phone?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      inquiry_type: body.inquiry_type || "afternoon_tea",
      headcount: body.headcount ? Number(body.headcount) : null,
      budget_range: body.budget_range?.trim() || null,
      preferred_date: body.preferred_date?.trim() || null,
      message,
    })
    .select()
    .single();

  if (error) {
    // fallback admin insert if RLS blocks anonymous
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("corporate_inquiries")
      .insert({
        user_id: auth?.profile.id ?? null,
        company_name: companyName,
        contact_name: contactName,
        contact_phone: body.contact_phone?.trim() || null,
        contact_email: body.contact_email?.trim() || null,
        inquiry_type: body.inquiry_type || "afternoon_tea",
        headcount: body.headcount ? Number(body.headcount) : null,
        budget_range: body.budget_range?.trim() || null,
        preferred_date: body.preferred_date?.trim() || null,
        message,
      })
      .select()
      .single();
    if (adminError) return NextResponse.json({ error: adminError.message }, { status: 500 });
    return NextResponse.json({ ok: true, inquiry: adminData }, { status: 201 });
  }

  return NextResponse.json({ ok: true, inquiry: data }, { status: 201 });
}
