import Link from "next/link";
import { DesktopBrandLogo } from "@/components/desktop/DesktopBrandLogo";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
import { DESKTOP_COLORS } from "@/lib/desktop/brand-assets";
import { APP_ROUTES } from "@/lib/site-links";

const COLUMNS = [
  {
    title: "購物指南",
    links: [
      { href: "/help/order-guide", label: "訂購說明" },
      { href: APP_ROUTES.support, label: "常見問題" },
      { href: "/support/shipping", label: "配送說明" },
      { href: "/support/returns", label: "退換貨" },
    ],
  },
  {
    title: "會員服務",
    links: [
      { href: APP_ROUTES.member, label: "會員中心" },
      { href: APP_ROUTES.memberOrders, label: "我的訂單" },
      { href: APP_ROUTES.memberBenefits, label: "會員禮遇" },
      { href: APP_ROUTES.favorites, label: "我的收藏" },
    ],
  },
  {
    title: "關於我們",
    links: [
      { href: APP_ROUTES.stores, label: "門市資訊" },
      { href: "/corporate", label: "企業合作" },
      { href: APP_ROUTES.terms, label: "服務條款" },
      { href: APP_ROUTES.privacy, label: "隱私權政策" },
    ],
  },
] as const;

export function DesktopFooter() {
  return (
    <footer
      className="mt-12 border-t border-[#E9EDF2] text-[#153E73]"
      style={{
        background: `linear-gradient(to bottom, ${DESKTOP_COLORS.warmWhite}, ${DESKTOP_COLORS.cream})`,
      }}
    >
      <DesktopContainer className="grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <DesktopBrandLogo height={40} />
          <p className="text-sm font-semibold tracking-wide text-[#153E73]">
            Bake a Better Life
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-[#687386]">
            烘焙生活平台 — 材料、食譜與門市服務，一次滿足。
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-sm font-bold text-[#153E73]">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#687386] transition-colors hover:text-[#153E73]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </DesktopContainer>
      <div className="border-t border-[#E9EDF2] py-4 text-center text-xs text-[#687386]">
        © {new Date().getFullYear()} CHIMEIDIY. All rights reserved. ·{" "}
        <Link href={APP_ROUTES.terms} className="hover:underline">
          服務條款
        </Link>
        {" · "}
        <Link href={APP_ROUTES.privacy} className="hover:underline">
          隱私權政策
        </Link>
      </div>
    </footer>
  );
}
