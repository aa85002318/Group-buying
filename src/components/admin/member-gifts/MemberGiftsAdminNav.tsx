import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin/member-gifts", label: "儀表板", exact: true },
  { href: "/admin/member-gifts/campaigns", label: "活動管理" },
  { href: "/admin/member-gifts/items", label: "兌換品項" },
  { href: "/admin/member-gifts/vouchers", label: "兌換券管理" },
  { href: "/admin/member-gifts/reversals", label: "沖銷申請" },
  { href: "/admin/member-gifts/redeem", label: "門市核銷" },
  { href: "/admin/member-gifts/logs", label: "核銷紀錄" },
  { href: "/admin/member-gifts/reports", label: "報表統計" },
  { href: "/admin/member-gifts/qa", label: "驗收清單" },
];

export function MemberGiftsAdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="門市會員禮"
      className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#E7EAF0] bg-white p-1"
    >
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition",
              active
                ? "bg-[#FEE169] text-[#153E73]"
                : "text-[#687386] hover:bg-[#FFFDF6]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
