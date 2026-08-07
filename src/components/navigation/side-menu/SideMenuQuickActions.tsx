"use client";

import Link from "next/link";
import {
  ClipboardList,
  Headphones,
  Heart,
  ScanBarcode,
  type LucideIcon,
} from "lucide-react";
import { SIDE_MENU_QUICK_ACTIONS, sideMenuAuthHref } from "@/lib/navigation/side-menu-routes";

const ICONS: Record<string, LucideIcon> = {
  favorites: Heart,
  orders: ClipboardList,
  pickup: ScanBarcode,
  support: Headphones,
};

export function SideMenuQuickActions({
  loggedIn,
  badges,
  onNavigate,
}: {
  loggedIn: boolean;
  badges: { orders?: number; pickup?: number; favorites?: number };
  onNavigate: () => void;
}) {
  return (
    <div className="mt-auto border-t border-[#F0ECE5] px-3 py-3">
      <div className="grid grid-cols-4 gap-1">
        {SIDE_MENU_QUICK_ACTIONS.map((action) => {
          const Icon = ICONS[action.id] || Heart;
          const href = sideMenuAuthHref(action.href, loggedIn || !action.requiresAuth);
          const badge =
            action.badgeKey === "orders"
              ? badges.orders
              : action.badgeKey === "pickup"
                ? badges.pickup
                : action.badgeKey === "favorites"
                  ? badges.favorites
                  : 0;
          return (
            <Link
              key={action.id}
              href={href}
              onClick={onNavigate}
              className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[#153E73] hover:bg-[#FFF5CC]"
            >
              <Icon className="h-5 w-5" strokeWidth={1.85} />
              <span className="text-center text-[12px] font-medium leading-tight">
                {action.label}
              </span>
              {badge != null && badge > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F16458] px-1 text-[10px] font-bold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
