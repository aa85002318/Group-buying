import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ staff: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("staff")
    .select("*, profiles!staff_user_id_fkey(full_name, email), stores(name)")
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { email, store_id: storeId, title } = await request.json();
  if (!email || !storeId) {
    return NextResponse.json({ error: "請提供 Email 與門市" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "找不到此 Email 的會員，請先註冊" }, { status: 404 });
  }

  await admin.from("profiles").update({ role: "store_staff", store_id: storeId }).eq("id", profile.id);

  const { data, error: insertError } = await admin
    .from("staff")
    .upsert(
      { user_id: profile.id, store_id: storeId, title: title ?? null, is_active: true },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "assign_staff", "staff", data.id, null, data);
  return NextResponse.json({ staff: data });
}
