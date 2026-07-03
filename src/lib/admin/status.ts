import type { BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

export function orderStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    pending: "secondary",
    awaiting_payment: "warning",
    payment_reported: "warning",
    payment_confirmed: "primary",
    preparing: "primary",
    ready_for_pickup: "success",
    completed: "success",
    cancelled: "danger",
    refunded: "danger",
  };
  return map[status] ?? "default";
}

export function paymentStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    pending: "warning",
    confirmed: "success",
    rejected: "danger",
  };
  return map[status] ?? "default";
}

export function commissionStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    pending_calculation: "secondary",
    pending_review: "warning",
    approved: "primary",
    issued: "success",
    rejected: "danger",
    cancelled: "secondary",
    clawed_back: "danger",
  };
  return map[status] ?? "default";
}

export function rewardStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    pending: "warning",
    approved: "primary",
    issued: "success",
    rejected: "danger",
  };
  return map[status] ?? "default";
}

export function ticketStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    open: "warning",
    in_progress: "primary",
    resolved: "success",
    closed: "secondary",
  };
  return map[status] ?? "default";
}

export function groupBuyStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    draft: "secondary",
    active: "success",
    ended: "default",
    cancelled: "danger",
  };
  return map[status] ?? "default";
}

export function livestreamStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    scheduled: "secondary",
    live: "success",
    ended: "default",
  };
  return map[status] ?? "default";
}
