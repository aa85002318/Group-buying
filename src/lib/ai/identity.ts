import { getAuthUser } from "@/lib/auth";
import type { UsageIdentity } from "./usage";

export async function resolveAIIdentity(request: Request): Promise<UsageIdentity> {
  const auth = await getAuthUser();
  const forwarded = request.headers.get("x-forwarded-for") ?? "anon";
  const guestKey = `guest:${forwarded.split(",")[0]?.trim() || "local"}`;
  return {
    userId: auth?.profile?.id ?? null,
    role: auth?.profile?.role ?? null,
    guestKey,
  };
}
