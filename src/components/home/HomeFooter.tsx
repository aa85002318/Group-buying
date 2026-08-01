import Link from "next/link";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

/** Brand yellow — same as homepage header / hero plane. */
const FOOTER_BRAND_YELLOW = "#FDE045";

/**
 * Site-wide consumer footer — brand yellow bar, no top/bottom rule lines.
 * Content: brand name, support hours, legal / store links only.
 */
export function HomeFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn("border-0 pb-4 pt-5 text-center", className)}
      style={{ backgroundColor: FOOTER_BRAND_YELLOW }}
    >
      <div className="site-container site-content-container home-page-inner">
        <p className="text-sm font-bold text-[#153E73]">CHIMEIDIY 烘焙生活平台</p>
        <p className="mt-1 text-xs text-[#153E73]/80">
          客服服務時間 09:00–18:00 · 全台門市可取貨
        </p>
        <nav
          aria-label="頁尾連結"
          className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-[#153E73]"
        >
          <Link href={APP_ROUTES.support} className="transition hover:opacity-75">
            客服中心
          </Link>
          <Link href={APP_ROUTES.storeMap} className="transition hover:opacity-75">
            門市地址
          </Link>
          <Link href="/stores" className="transition hover:opacity-75">
            營業時間
          </Link>
          <Link href="/terms" className="transition hover:opacity-75">
            使用條款
          </Link>
          <Link href="/privacy" className="transition hover:opacity-75">
            隱私權
          </Link>
        </nav>
      </div>
    </footer>
  );
}
