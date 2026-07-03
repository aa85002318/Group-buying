import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email/send-verification";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const origin = typeof body.origin === "string" ? body.origin : undefined;

  const result = await sendVerificationEmail({ email, origin });

  if (result.skipped) {
    return NextResponse.json(
      {
        error:
          "尚未設定 RESEND_API_KEY。請在 .env 設定 Resend，或關閉 Supabase 內錯誤的 Gmail SMTP 後改用 Supabase 預設寄信。",
        skipped: true,
      },
      { status: 503 }
    );
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "寄送失敗" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: `驗證信已寄至 ${email.trim()}`,
  });
}
