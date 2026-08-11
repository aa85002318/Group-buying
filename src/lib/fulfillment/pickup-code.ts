import { createHash, createCipheriv, createDecipheriv, randomBytes, randomInt } from "crypto";

const ALGO = "aes-256-gcm";

function pepper(): string {
  return (
    process.env.PICKUP_CODE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "chimeidiy-pickup-dev"
  );
}

function keyBytes(): Buffer {
  return createHash("sha256").update(pepper()).digest();
}

export function generatePickupPin(): string {
  return String(randomInt(100000, 999999));
}

export function generatePublicPickupToken(): string {
  return randomBytes(16).toString("hex");
}

export function hashPickupPin(pin: string): string {
  return createHash("sha256").update(`${pepper()}|pin|${pin.trim()}`).digest("hex");
}

export function encryptPickupPin(pin: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(pin, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${enc.toString("hex")}`;
}

export function decryptPickupPin(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [ivHex, tagHex, dataHex] = payload.split(".");
    if (!ivHex || !tagHex || !dataHex) return null;
    const decipher = createDecipheriv(ALGO, keyBytes(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

export function qrPayloadForToken(token: string): string {
  return `chimeidiy://pickup?token=${token}`;
}
