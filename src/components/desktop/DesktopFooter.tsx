import Link from "next/link";
import { DesktopContainer } from "@/components/desktop/DesktopContainer";
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
    <footer className="mt-16 border-t border-[#EDE6DC] bg-[#FFF8F0] text-[#5E4035]">
      <DesktopContainer className="grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <p className="text-xl font-bold tracking-wide text-[#153E73]">CHIMEIDIY</p>
          <p className="max-w-xs text-sm leading-relaxed text-[#7A5C4E]">
            烘焙生活平台 — 材料、食譜與門市服務，一次滿足。
          </p>
          <p className="text-sm text-[#7A5C4E]">
            客服：
            <Link href={APP_ROUTES.support} className="underline-offset-2 hover:underline">
              聯絡我們
            </Link>
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
                    className="text-sm text-[#7A5C4E] transition-colors hover:text-[#153E73]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </DesktopContainer>
      <div className="border-t border-[#EDE6DC] py-4 text-center text-xs text-[#9A7B6C]">
        © {new Date().getFullYear()} CHIMEIDIY. All rights reserved.
      </div>
    </footer>
  );
}
