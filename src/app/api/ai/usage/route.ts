import { aiOk } from "@/lib/ai/response";
import { resolveAIIdentity } from "@/lib/ai/identity";
import { getUsageSnapshot } from "@/lib/ai/usage";

export async function GET(request: Request) {
  const identity = await resolveAIIdentity(request);
  const snap = await getUsageSnapshot(identity);
  return aiOk({
    used: snap.used,
    remaining: snap.remaining,
    resetAt: snap.resetAt,
    limit: snap.limit,
  });
}
