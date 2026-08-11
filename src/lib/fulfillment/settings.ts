export type FulfillmentSettings = {
  hold_days_ambient: number;
  hold_days_chilled: number;
  hold_days_frozen: number;
  remind_days_before: number;
  remind_on_due_day: boolean;
  allow_extend_once: boolean;
  extend_days: number;
  prep_days: number;
  expired_refund_policy: "manual" | "auto_refund" | "no_refund";
  auto_complete_after_pickup: boolean;
};

export const DEFAULT_FULFILLMENT_SETTINGS: FulfillmentSettings = {
  hold_days_ambient: 7,
  hold_days_chilled: 3,
  hold_days_frozen: 2,
  remind_days_before: 2,
  remind_on_due_day: true,
  allow_extend_once: true,
  extend_days: 3,
  prep_days: 1,
  expired_refund_policy: "manual",
  auto_complete_after_pickup: true,
};

export function holdDaysForZones(
  settings: FulfillmentSettings,
  zones: Array<"ambient" | "chilled" | "frozen">
): number {
  if (zones.includes("frozen")) return settings.hold_days_frozen;
  if (zones.includes("chilled")) return settings.hold_days_chilled;
  return settings.hold_days_ambient;
}

export function addDays(isoOrDate: string | Date, days: number): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
