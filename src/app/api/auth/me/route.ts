import { NextResponse } from "next/server";
import { getAuthUser, isEmailVerified } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { user, profile } = auth;
  const emailVerified = isEmailVerified(user);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      email_confirmed_at: emailVerified ? new Date().toISOString() : null,
    },
    profile,
    email_verified: emailVerified,
  });
}
