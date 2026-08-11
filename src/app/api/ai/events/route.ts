import { aiOk, aiError } from "@/lib/ai/response";
import { trackAnalyticsEvent, type AnalyticsEventType } from "@/lib/ai/analytics";

const TYPES: AnalyticsEventType[] = ["recipe_click", "product_click", "add_to_cart"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const eventType = body.eventType as AnalyticsEventType;
  if (!TYPES.includes(eventType)) {
    return aiError("VALIDATION", "未知事件", { status: 400 });
  }
  await trackAnalyticsEvent({
    eventType,
    tool: typeof body.tool === "string" ? body.tool : undefined,
    label: typeof body.label === "string" ? body.label : undefined,
  });
  return aiOk({ tracked: true });
}
