import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { canonicalizeStatus } from "./status";
import { getFulfillmentSettings } from "./settings-store";
import { transitionOrderStatus } from "./transitions";
import { sendPickupReminder } from "./notifications";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function runFulfillmentPickupJobs() {
  if (!isSupabaseConfigured()) {
    return { expired: 0, reminded: 0, skipped: true as const };
  }

  const settings = await getFulfillmentSettings();
  const admin = createAdminClient();
  const now = new Date();
  const { data } = await admin
    .from("orders")
    .select("id, status, fulfillment_status, pickup_deadline_at")
    .not("pickup_deadline_at", "is", null)
    .limit(500);

  let expired = 0;
  let reminded = 0;

  for (const row of data ?? []) {
    const status = canonicalizeStatus(row.status, row.fulfillment_status);
    if (status !== "ready_for_pickup" || !row.pickup_deadline_at) continue;
    const deadline = new Date(row.pickup_deadline_at);

    if (deadline < now) {
      await transitionOrderStatus({
        orderId: row.id,
        to: "pickup_expired",
        actorId: null,
        actorRole: "system",
        note: "超過取貨期限自動標記逾期",
      });
      expired += 1;
      continue;
    }

    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const dueToday = startOfDay(deadline).getTime() === startOfDay(now).getTime();
    const shouldRemind =
      daysLeft === settings.remind_days_before || (settings.remind_on_due_day && dueToday);
    if (!shouldRemind) continue;

    const eventKey = dueToday ? "pickup_due_today" : "pickup_remind";
    const { data: already } = await admin
      .from("notification_logs")
      .select("id")
      .eq("order_id", row.id)
      .eq("event_key", eventKey)
      .limit(1)
      .maybeSingle();
    if (already) continue;

    await sendPickupReminder(row.id, dueToday);
    reminded += 1;
  }

  return { expired, reminded, skipped: false as const };
}
