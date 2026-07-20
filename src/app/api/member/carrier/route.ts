import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { parseCarrierInput } from "@/lib/validation/invoice-carrier";

export type InvoiceCarrier = {
  id: string;
  user_id: string;
  carrier_type: string;
  carrier_name: string | null;
  carrier_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "未登入" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ carrier: null });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_carriers")
    .select("id, carrier_type, carrier_name, carrier_code, is_default, created_at, updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ carrier: null });
    return NextResponse.json({ error: "載入失敗" }, { status: 500 });
  }

  return NextResponse.json({ carrier: data });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: { carrier_name?: string; carrier_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  if (!body.carrier_code?.trim()) {
    return NextResponse.json({ error: "請輸入手機條碼" }, { status: 400 });
  }

  const parsed = parseCarrierInput({ carrier_name: body.carrier_name, carrier_code: body.carrier_code });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      carrier: {
        id: "mock-carrier",
        carrier_type: "mobile_barcode",
        carrier_name: parsed.carrier_name,
        carrier_code: parsed.carrier_code,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("invoice_carriers")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "您已設定發票載具，請使用編輯功能" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("invoice_carriers")
    .insert({
      user_id: auth.user.id,
      carrier_type: "mobile_barcode",
      carrier_name: parsed.carrier_name,
      carrier_code: parsed.carrier_code,
    })
    .select("id, carrier_type, carrier_name, carrier_code, is_default, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: "儲存失敗，請稍後再試" }, { status: 500 });
  return NextResponse.json({ carrier: data });
}

export async function PATCH(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: { carrier_name?: string; carrier_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  if (!body.carrier_code?.trim()) {
    return NextResponse.json({ error: "請輸入手機條碼" }, { status: 400 });
  }

  const parsed = parseCarrierInput({ carrier_name: body.carrier_name, carrier_code: body.carrier_code });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      carrier: {
        id: "mock-carrier",
        carrier_type: "mobile_barcode",
        carrier_name: parsed.carrier_name,
        carrier_code: parsed.carrier_code,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_carriers")
    .update({
      carrier_name: parsed.carrier_name,
      carrier_code: parsed.carrier_code,
    })
    .eq("user_id", auth.user.id)
    .select("id, carrier_type, carrier_name, carrier_code, is_default, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: "更新失敗，請稍後再試" }, { status: 500 });
  return NextResponse.json({ carrier: data });
}

export async function DELETE() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "未登入" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("invoice_carriers").delete().eq("user_id", auth.user.id);

  if (error) return NextResponse.json({ error: "刪除失敗，請稍後再試" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
