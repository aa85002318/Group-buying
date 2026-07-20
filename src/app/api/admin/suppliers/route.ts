import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      suppliers: [
        { id: "sup-1", name: "台灣食品供應商", contact_name: "王小姐", contact_phone: "02-12345678", contact_email: "wang@example.com", note: "", is_active: true, product_count: 8 },
        { id: "sup-2", name: "生鮮直送", contact_name: "李大哥", contact_phone: "0912345678", contact_email: null, note: "週二、週五到貨", is_active: true, product_count: 4 },
      ],
    });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("suppliers")
    .select("id, name, contact_name, contact_phone, contact_email, note, is_active, created_at")
    .order("name");

  if (fetchError) return NextResponse.json({ suppliers: [] });

  const suppliers = await Promise.all(
    (data ?? []).map(async (supplier) => {
      const { count } = await admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", supplier.id);
      return { ...supplier, product_count: count ?? 0 };
    })
  );

  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "請填寫供應商名稱" }, { status: 400 });
  }

  const row = {
    name: body.name.trim(),
    contact_name: body.contact_name?.trim() || null,
    contact_phone: body.contact_phone?.trim() || null,
    contact_email: body.contact_email?.trim() || null,
    note: body.note?.trim() || null,
    is_active: body.is_active !== false,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ supplier: { id: `sup-${Date.now()}`, ...row, product_count: 0 } });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("suppliers").insert(row).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "create", "supplier", data.id, null, data);
  }

  return NextResponse.json({ supplier: { ...data, product_count: 0 } });
}
