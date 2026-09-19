"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminShell } from "@/components/admin/AdminShell";
import type { AdminRole } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

export type AdminSectionTab = {
  href: string;
  label: string;
  /** Match only the exact path (e.g. a list page whose children are editors). */
  exact?: boolean;
  /** Omit = everyone who can open the section. */
  roles?: AdminRole[];
};

function tabActive(pathname: string, tab: AdminSectionTab) {
  if (tab.exact) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

/**
 * In-page tab bar for a sidebar section whose sub-pages were folded into a
 * single sidebar entry (same look as MemberGiftsAdminNav). Renders only when
 * the current page is one of the tabs, so editors / detail pages under the
 * same folder stay clean.
 */
export function AdminSectionTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: AdminSectionTab[];
}) {
  const pathname = usePathname();
  const { profile } = useAdminShell();
  const role = profile?.role;

  if (!tabs.some((tab) => tabActive(pathname, tab))) return null;

  const visible = tabs.filter(
    (tab) => !tab.roles || role === "admin" || (role ? tab.roles.includes(role as AdminRole) : true)
  );

  return (
    <nav
      aria-label={label}
      className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#E7EAF0] bg-white p-1"
    >
      {visible.map((tab) => {
        const active = tabActive(pathname, tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition",
              active ? "bg-[#FEE169] text-[#153E73]" : "text-[#687386] hover:bg-[#FFFDF6]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
