import { aiError, aiOk } from "@/lib/ai/response";
import { searchShopProducts } from "@/lib/ai/product-search";
import { resolveAIIdentity } from "@/lib/ai/identity";
import { getUsageSnapshot } from "@/lib/ai/usage";

export async function POST(request: Request) {
  const identity = await resolveAIIdentity(request);
  const snap = await getUsageSnapshot(identity);
  const body = await request.json().catch(() => ({}));
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.map(String)
    : String(body.q ?? "")
        .split(/[,，、\s]+/)
        .filter(Boolean);
  if (keywords.length === 0) {
    return aiError("VALIDATION", "請提供商品關鍵字", { status: 400 });
  }
  const products = await searchShopProducts(keywords);
  return aiOk(
    { products },
    { used: snap.used, remaining: snap.remaining, resetAt: snap.resetAt }
  );
}
