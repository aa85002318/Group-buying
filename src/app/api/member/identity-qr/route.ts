import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import {
  createMemberIdentityToken,
  MEMBER_IDENTITY_QR_TTL_MS,
} from "@/lib/member/identity-qr-token";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    const { token, expiresAt } = createMemberIdentityToken({ memberId: "demo-member" });
    return NextResponse.json({
      token,
      expires_at: expiresAt,
      member_number: "CM000001",
      refresh_ms: MEMBER_IDENTITY_QR_TTL_MS,
    });
  }

  const profile = auth!.profile as {
    id: string;
    member_number?: string | null;
    member_code?: string | null;
  };

  const { token, expiresAt } = createMemberIdentityToken({ memberId: profile.id });

  return NextResponse.json({
    token,
    expires_at: expiresAt,
    member_number: profile.member_number ?? profile.member_code ?? null,
    refresh_ms: MEMBER_IDENTITY_QR_TTL_MS,
  });
}
