import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { isValidTaiwanPhone, normalizePhone } from "@/lib/validation/customer";
import { createClient } from "@/lib/supabase/server";

const MAX_ADDRESSES = 10;

function formatAddress(row: Record<string, unknown>) {
  return row;
}

async function ensureSingleDefault(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, defaultId: string) {
  await supabase.from("member_addresses").update({ is_default: false }).eq("user_id", userId).neq("id", defaultId);
  await supabase.from("member_addresses").update({ is_default: true }).eq("id", defaultId);
}

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ addresses: [] });
  }

  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("member_addresses")
    .select("*")
    .eq("user_id", auth!.profile.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (fetchError) {
    if (fetchError.code === "42P01") return NextResponse.json({ addresses: [] });
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
  }

  return NextResponse.json({ addresses: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const recipientName = body.recipient_name?.trim();
  const phone = body.phone?.trim();
  const city = body.city?.trim();
  const district = body.district?.trim();
  const addressLine = body.address_line?.trim();

  if (!recipientName) return NextResponse.json({ error: "請填寫收件人姓名" }, { status: 400 });
  if (!phone || !isValidTaiwanPhone(phone)) return NextResponse.json({ error: "請輸入有效的手機號碼" }, { status: 400 });
  if (!city || !district || !addressLine) return NextResponse.json({ error: "請完整填寫地址" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      address: {
        id: `addr-${Date.now()}`,
        recipient_name: recipientName,
        phone: normalizePhone(phone),
        city,
        district,
        address_line: addressLine,
        postal_code: body.postal_code?.trim() || null,
        label: body.label?.trim() || null,
        is_default: Boolean(body.is_default),
      },
    });
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("member_addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth!.profile.id);

  if ((count ?? 0) >= MAX_ADDRESSES) {
    return NextResponse.json({ error: `最多只能儲存 ${MAX_ADDRESSES} 組地址` }, { status: 400 });
  }

  const isDefault = Boolean(body.is_default) || count === 0;
  const row = {
    user_id: auth!.profile.id,
    recipient_name: recipientName,
    phone: normalizePhone(phone),
    postal_code: body.postal_code?.trim() || null,
    city,
    district,
    address_line: addressLine,
    label: body.label?.trim() || null,
    note: body.note?.trim() || null,
    is_default: isDefault,
  };

  const { data, error: insertError } = await supabase.from("member_addresses").insert(row).select().single();
  if (insertError) return NextResponse.json({ error: "新增失敗" }, { status: 500 });

  if (isDefault && data) await ensureSingleDefault(supabase, auth!.profile.id, data.id);
  return NextResponse.json({ address: formatAddress(data) });
}
