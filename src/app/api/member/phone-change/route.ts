import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPhoneTaken } from "@/lib/services/profileService";
import { isValidTaiwanPhone, normalizePhone } from "@/lib/validation/customer";
import {
  generatePhoneChangeCode,
  sendPhoneChangeCodeEmail,
} from "@/lib/member/account-security";

/** Start phone change: duplicate check + email verification code */
export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  if (!isValidTaiwanPhone(phoneRaw)) {
    return NextResponse.json(
      { error: "請輸入有效的手機號碼（09 開頭，共 10 碼）" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(phoneRaw);
  const current = (auth!.profile as { phone?: string | null }).phone;
  if (current && normalizePhone(current) === phone) {
    return NextResponse.json({ error: "新手機號碼與目前相同" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "示範模式：驗證碼已寄出（000000）",
    });
  }

  const admin = createAdminClient();
  const taken = await isPhoneTaken(admin, phone, auth!.profile.id);
  if (taken) {
    return NextResponse.json(
      { error: "此手機號碼已被其他會員使用" },
      { status: 409 }
    );
  }

  const code = generatePhoneChangeCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: updError } = await admin
    .from("profiles")
    .update({
      pending_phone: phone,
      phone_change_code: code,
      phone_change_expires_at: expires,
    })
    .eq("id", auth!.profile.id);

  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  const email =
    auth!.user.email ||
    (auth!.profile as { email?: string | null }).email ||
    "";
  if (!email) {
    return NextResponse.json(
      { error: "帳號沒有 Email，無法寄送驗證碼" },
      { status: 400 }
    );
  }

  const sent = await sendPhoneChangeCodeEmail({
    to: email,
    code,
    pendingPhone: phone,
  });
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error ?? "驗證碼寄送失敗，請稍後再試" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `驗證碼已寄至 ${email}`,
    expires_at: expires,
  });
}

/** Confirm phone change with code */
export async function PUT(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "請輸入 6 碼驗證碼" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, phone: "0912345678" });
  }

  const admin = createAdminClient();
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("pending_phone, phone_change_code, phone_change_expires_at")
    .eq("id", auth!.profile.id)
    .single();

  if (fetchError || !profile?.pending_phone || !profile.phone_change_code) {
    return NextResponse.json(
      { error: "沒有進行中的手機變更申請" },
      { status: 400 }
    );
  }

  if (
    profile.phone_change_expires_at &&
    new Date(profile.phone_change_expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json({ error: "驗證碼已過期，請重新申請" }, { status: 400 });
  }

  if (profile.phone_change_code !== code) {
    return NextResponse.json({ error: "驗證碼不正確" }, { status: 400 });
  }

  const phone = normalizePhone(String(profile.pending_phone));
  const taken = await isPhoneTaken(admin, phone, auth!.profile.id);
  if (taken) {
    return NextResponse.json(
      { error: "此手機號碼已被其他會員使用" },
      { status: 409 }
    );
  }

  const { error: updError } = await admin
    .from("profiles")
    .update({
      phone,
      phone_verified: true,
      pending_phone: null,
      phone_change_code: null,
      phone_change_expires_at: null,
    })
    .eq("id", auth!.profile.id);

  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone });
}
