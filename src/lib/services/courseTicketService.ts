import { createHash, randomBytes } from "crypto";

export function generateTicketCode(): string {
  const raw = randomBytes(6).toString("hex").toUpperCase();
  return `CMT-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function buildTicketPayload(enrollmentId: string, ticketCode: string): string {
  const sig = createHash("sha256").update(`${enrollmentId}:${ticketCode}`).digest("hex").slice(0, 12);
  return `chimeidiy-course:${enrollmentId}:${ticketCode}:${sig}`;
}
