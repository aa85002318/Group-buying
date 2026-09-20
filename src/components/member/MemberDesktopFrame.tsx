"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "@/components/desktop/layout/DesktopSidebar";
import { useDesktopV2Active } from "@/hooks/useDesktopV2Active";
import {
  MEMBER_SIDEBAR_ITEMS,
  memberSidebarActiveKey,
} from "@/lib/desktop/inner-page-config";
import { APP_ROUTES } from "@/lib/site-links";

/**
 * Desktop V2: member sub-pages share the member sidebar on the left.
 * The /member hub renders its own DesktopMember layout, and mobile /
 * production keep the original single-column pages untouched.
 */
export function MemberDesktopFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const desktopV2 = useDesktopV2Active();
  const isHub = pathname === APP_ROUTES.member || pathname === `${APP_ROUTES.member}/`;

  if (!desktopV2 || isHub) return <>{children}</>;

  return (
    <div className="grid gap-4 pt-2 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[240px_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="lg:sticky lg:top-[96px]">
          <DesktopSidebar
            title="會員中心"
            items={MEMBER_SIDEBAR_ITEMS}
            activeKey={memberSidebarActiveKey(pathname)}
          />
        </div>
      </div>
      <div className="member-desktop-content min-w-0 rounded-2xl bg-white p-4 sm:p-6 xl:p-8">{children}</div>
    </div>
  );
}
