"use client";

import Link from "next/link";
import { APP_ROUTES } from "@/lib/site-links";

export type MemberOrderCounts = {
  awaitingPayment: number;
  awaitingShipment: number;
  readyForPickup: number;
  completed: number;
};

const STATUSES: Array<{
  key: keyof MemberOrderCounts;
  label: string;
  filter: string;
}> = [
  { key: "awaitingPayment", label: "待付款", filter: "awaiting" },
  { key: "awaitingShipment", label: "待出貨", filter: "shipping" },
  { key: "readyForPickup", label: "待取貨", filter: "pickup" },
  { key: "completed", label: "已完成", filter: "completed" },
];

export function MemberOrderStatus({ counts }: { counts: MemberOrderCounts | null }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div>
          <h2 className="text-base font-bold text-[#153E73]">我的訂單</h2>
          <p className="mt-0.5 text-xs text-[#687386]">僅 App 商城／團購訂單</p>
        </div>
        <Link href={APP_ROUTES.memberOrders} className="text-xs font-semibold text-[#79C7E8]">
          全部
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {STATUSES.map((item) => {
          const count = counts?.[item.key] ?? 0;
          return (
            <Link
              key={item.key}
              href={`${APP_ROUTES.memberOrders}?filter=${item.filter}`}
              className="relative rounded-2xl bg-white px-1 py-3 text-center"
            >
              <span className="block text-lg font-bold tabular-nums text-[#153E73]">
                {count > 99 ? "99+" : count}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-[#687386]">{item.label}</span>
              {count > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#F16458]" aria-hidden />
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
