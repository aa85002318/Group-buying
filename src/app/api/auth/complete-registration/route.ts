import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { isValidBirthday, isValidTaiwanPhone, memberCodeFromPhone, normalizePhone } from "@/lib/validation/customer";
import { isPhoneTaken } from "@/lib/services/profileService";

/** After signUp, persist customer fields to profiles (service role). */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: {
    user_id?: string;
    full_name?: string;
    phone?: string;
    birthday?: string;
    email?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const { user_id, full_name, phone, birthday, email } = body;
  if (!user_id || !full_name?.trim() || !phone || !birthday) {
    return NextResponse.json({ error: "請填寫姓名、電話與生日" }, { status: 400 });
  }

  if (!isValidTaiwanPhone(phone)) {
    return NextResponse.json({ error: "請輸入有效的手機號碼（09 開頭，共 10 碼）" }, { status: 400 });
  }

  if (!isValidBirthday(birthday)) {
    return NextResponse.json({ error: "請輸入有效的生日" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(user_id);
  if (authError || !authUser.user) {
    return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, full_name, phone, birthday")
    .eq("id", user_id)
    .maybeSingle();

  const profileComplete = Boolean(
    existingProfile?.full_name?.trim() &&
      existingProfile?.phone?.trim() &&
      existingProfile?.birthday
  );

  if (profileComplete) {
    return NextResponse.json({ ok: true, profile: existingProfile, already_complete: true });
  }

  const normalizedPhone = normalizePhone(phone);
  const memberCode = memberCodeFromPhone(normalizedPhone);
  const profileEmail = email?.trim() || authUser.user.email || null;

  const taken = await isPhoneTaken(admin, normalizedPhone, user_id);
  if (taken) {
    return NextResponse.json({ error: "此手機號碼已被註冊" }, { status: 409 });
  }

  const payload = {
    email: profileEmail,
    full_name: full_name.trim(),
    phone: normalizedPhone,
    birthday,
    member_code: memberCode,
  };

  const { data, error } = await admin
    .from("profiles")
    .update(payload)
    .eq("id", user_id)
    .select("id, email, full_name, phone, birthday, member_code")
    .single();

  if (error) {
    const { data: inserted, error: insertError } = await admin
      .from("profiles")
      .insert({
        id: user_id,
        ...payload,
        role: "member",
      })
      .select("id, email, full_name, phone, birthday, member_code")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, profile: inserted });
  }

  return NextResponse.json({ ok: true, profile: data });
}
