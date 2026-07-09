import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { sendVerificationEmail } from "@/lib/email/send-verification";
import { isValidBirthday, isValidTaiwanPhone, memberCodeFromPhone, normalizePhone } from "@/lib/validation/customer";
import { isPhoneTaken } from "@/lib/services/profileService";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "尚未設定 Supabase" }, { status: 503 });
  }

  let body: {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
    birthday?: string;
    origin?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const phone = body.phone ?? "";
  const birthday = body.birthday ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "請填寫 Email 與密碼" }, { status: 400 });
  }
  if (!fullName || !phone || !birthday) {
    return NextResponse.json({ error: "請填寫姓名、電話與生日" }, { status: 400 });
  }
  if (!isValidTaiwanPhone(phone)) {
    return NextResponse.json({ error: "請輸入有效的手機號碼（09 開頭，共 10 碼）" }, { status: 400 });
  }
  if (!isValidBirthday(birthday)) {
    return NextResponse.json({ error: "請輸入有效的生日" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密碼至少需要 6 個字元" }, { status: 400 });
  }

  const admin = createAdminClient();
  const normalizedPhone = normalizePhone(phone);
  const memberCode = memberCodeFromPhone(normalizedPhone);

  const phoneTaken = await isPhoneTaken(admin, normalizedPhone);
  if (phoneTaken) {
    return NextResponse.json({ error: "此手機號碼已被註冊" }, { status: 409 });
  }

  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = existingUsers?.users.find((u) => u.email?.toLowerCase() === email);

  let userId: string;

  if (existing) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone, birthday")
      .eq("id", existing.id)
      .maybeSingle();

    const profileComplete = Boolean(profile?.full_name?.trim() && profile?.phone?.trim() && profile?.birthday);
    if (profileComplete) {
      return NextResponse.json(
        { error: "此 Email 已註冊，請直接登入；若未驗證 Email，可在登入頁重新寄送驗證信。" },
        { status: 409 }
      );
    }

    userId = existing.id;
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { full_name: fullName, phone: normalizedPhone, birthday },
    });
    if (updateAuthError) {
      return NextResponse.json({ error: updateAuthError.message }, { status: 400 });
    }
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
        phone: normalizedPhone,
        birthday,
      },
    });

    if (createError || !created.user) {
      const msg = createError?.message ?? "註冊失敗";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        return NextResponse.json(
          { error: "此 Email 已註冊，請直接登入。" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    userId = created.user.id;
  }

  const profilePayload = {
    email,
    full_name: fullName,
    phone: normalizedPhone,
    birthday,
    member_code: memberCode,
    role: "member" as const,
  };

  const { error: profileError } = await admin.from("profiles").upsert(
    { id: userId, ...profilePayload },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const verify = await sendVerificationEmail({
    email,
    origin: typeof body.origin === "string" ? body.origin : undefined,
  });

  if (!verify.ok && !verify.skipped) {
    return NextResponse.json(
      {
        ok: true,
        user_id: userId,
        warning: verify.error ?? "帳號已建立，但驗證信寄送失敗，請至登入頁重新寄送。",
      },
      { status: 201 }
    );
  }

  if (verify.skipped) {
    return NextResponse.json(
      {
        ok: true,
        user_id: userId,
        warning: "帳號已建立，但尚未設定 RESEND_API_KEY，無法寄送驗證信。",
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ ok: true, user_id: userId }, { status: 201 });
}
