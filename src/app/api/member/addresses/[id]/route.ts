import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { isValidTaiwanPhone, normalizePhone } from "@/lib/validation/customer";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.recipient_name !== undefined) updates.recipient_name = body.recipient_name.trim();
  if (body.phone !== undefined) {
    if (!isValidTaiwanPhone(body.phone)) return NextResponse.json({ error: "請輸入有效的手機號碼" }, { status: 400 });
    updates.phone = normalizePhone(body.phone);
  }
  if (body.city !== undefined) updates.city = body.city.trim();
  if (body.district !== undefined) updates.district = body.district.trim();
  if (body.address_line !== undefined) updates.address_line = body.address_line.trim();
  if (body.postal_code !== undefined) updates.postal_code = body.postal_code?.trim() || null;
  if (body.label !== undefined) updates.label = body.label?.trim() || null;
  if (body.note !== undefined) updates.note = body.note?.trim() || null;
  if (body.is_default !== undefined) updates.is_default = Boolean(body.is_default);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ address: { id, ...updates } });
  }

  const supabase = await createClient();
  const { data, error: updateError } = await supabase
    .from("member_addresses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", auth!.profile.id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: "更新失敗" }, { status: 500 });

  if (body.is_default) {
    await supabase.from("member_addresses").update({ is_default: false }).eq("user_id", auth!.profile.id).neq("id", id);
    await supabase.from("member_addresses").update({ is_default: true }).eq("id", id);
  }

  return NextResponse.json({ address: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("member_addresses")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", auth!.profile.id)
    .single();

  const { error: deleteError } = await supabase
    .from("member_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", auth!.profile.id);

  if (deleteError) return NextResponse.json({ error: "刪除失敗" }, { status: 500 });

  if (target?.is_default) {
    const { data: next } = await supabase
      .from("member_addresses")
      .select("id")
      .eq("user_id", auth!.profile.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from("member_addresses").update({ is_default: true }).eq("id", next.id);
    }
  }

  return NextResponse.json({ ok: true });
}
