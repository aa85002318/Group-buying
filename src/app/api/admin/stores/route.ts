import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockStores } from "@/lib/mock-data";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ stores: mockStores });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("stores")
    .select("id, name, address, phone, notes, business_hours, is_active, created_at, updated_at")
    .order("name");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ stores: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!name || !address) {
    return NextResponse.json({ error: "請填寫取貨點名稱與地址" }, { status: 400 });
  }

  const payload = {
    name,
    address,
    phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    business_hours:
      typeof body.business_hours === "string" ? body.business_hours.trim() || null : null,
    is_active: body.is_active !== false,
  };

  if (!isSupabaseConfigured()) {
    const store = { id: `store-${Date.now()}`, ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    return NextResponse.json({ store }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("stores").insert(payload).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_store", "stores", data.id, null, data);
  return NextResponse.json({ store: data }, { status: 201 });
}
