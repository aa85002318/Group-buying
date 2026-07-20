import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ courses: [] });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("baking_courses")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });

  const body = await request.json();
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: "請填寫課程名稱" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("baking_courses")
    .insert({
      title,
      teacher_name: body.teacher_name?.trim() || "棋美老師",
      price: Number(body.price) || 0,
      capacity: Number(body.capacity) || 12,
      location: body.location?.trim() || null,
      description: body.description?.trim() || null,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_course", "baking_course", data.id, null, data);
  return NextResponse.json({ course: data }, { status: 201 });
}
