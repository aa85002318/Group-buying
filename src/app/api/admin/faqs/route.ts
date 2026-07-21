import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ faqs: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("faqs")
    .select("*")
    .order("category")
    .order("sort_order");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ faqs: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  const body = await request.json();
  const question = body.question?.trim();
  const answer = body.answer?.trim();
  const category = body.category?.trim() ?? "其他";

  if (!question || !answer) {
    return NextResponse.json({ error: "請填寫問題與答案" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("faqs")
    .insert({
      category,
      question,
      answer,
      is_active: body.is_active !== false,
      is_featured: Boolean(body.is_featured),
      sort_order: Number(body.sort_order) || 0,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_faq", "faq", data.id, null, data);
  return NextResponse.json({ faq: data }, { status: 201 });
}
