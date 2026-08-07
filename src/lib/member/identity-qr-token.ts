import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const TTL_MS = 60_000;

function secret() {
  return (
    process.env.MEMBER_IDENTITY_QR_SECRET ||
    process.env.MEMBER_GIFT_QR_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "chimeidiy-member-identity-dev-secret"
  );
}

export type MemberIdentityQrPayload = {
  member_id: string;
  nonce: string;
  expires_at: number;
  signature: string;
};

export function createMemberIdentityToken(input: {
  memberId: string;
  nonce?: string;
}): { token: string; payload: MemberIdentityQrPayload; expiresAt: number } {
  const nonce = input.nonce || randomBytes(8).toString("hex");
  const expires_at = Date.now() + TTL_MS;
  const body = `${input.memberId}.${nonce}.${expires_at}`;
  const signature = createHmac("sha256", secret()).update(body).digest("hex");
  const payload: MemberIdentityQrPayload = {
    member_id: input.memberId,
    nonce,
    expires_at,
    signature,
  };
  const token = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return { token, payload, expiresAt: expires_at };
}

export function verifyMemberIdentityToken(token: string): {
  ok: boolean;
  payload?: MemberIdentityQrPayload;
  error?: string;
} {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as MemberIdentityQrPayload;
    if (!payload?.member_id || !payload.signature) {
      return { ok: false, error: "invalid_token" };
    }
    if (Date.now() > Number(payload.expires_at)) {
      return { ok: false, error: "token_expired", payload };
    }
    const body = `${payload.member_id}.${payload.nonce}.${payload.expires_at}`;
    const expected = createHmac("sha256", secret()).update(body).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(payload.signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "bad_signature" };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, error: "invalid_token" };
  }
}

export const MEMBER_IDENTITY_QR_TTL_MS = TTL_MS;
