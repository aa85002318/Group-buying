"use client";

import Link from "next/link";
import { Barcode, Gift, History, ShoppingBag } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

const ACTIONS = [
  {
    key: "orders",
    label: "訂單紀錄",
    href: APP_ROUTES.memberOrders,
    icon: ShoppingBag,
  },
  {
    key: "pickup",
    label: "門市取貨碼",
    href: APP_ROUTES.memberBarcode,
    icon: Barcode,
  },
  {
    key: "gifts",
    label: "本月兌換禮",
    href: APP_ROUTES.memberBenefits,
    icon: Gift,
  },
  {
    key: "history",
    label: "核銷紀錄",
    href: `${APP_ROUTES.memberBenefits}?tab=history`,
    icon: History,
  },
] as const;

export function MemberQuickActions() {
  return (
    <section aria-label="快捷功能" className="grid grid-cols-4 gap-2">
      {ACTIONS.map(({ key, label, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white px-1 py-3 text-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF8FC] text-[#153E73]">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-[11px] font-semibold leading-tight text-[#153E73]">{label}</span>
        </Link>
      ))}
    </section>
  );
}
