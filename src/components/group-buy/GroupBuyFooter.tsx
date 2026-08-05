import Link from "next/link";
import { APP_ROUTES } from "@/lib/site-links";

/** Group-buy page footer — brand yellow, existing routes only. */
export function GroupBuyFooter() {
  return (
    <footer
      className="mt-2 px-4 py-8 text-center md:px-6 md:text-left"
      style={{
        backgroundColor: "#FFE149",
        paddingBottom: "32px",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-bold text-[#153E73]">CHIMEIDIY 烘焙生活平台</p>
          <p className="mt-1 text-xs text-[#153E73]/85">客服服務時間：09:00–18:00</p>
        </div>
        <nav
          aria-label="頁尾服務資訊"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-[#153E73] md:justify-end"
        >
          <Link href={APP_ROUTES.support} className="min-h-11 inline-flex items-center hover:opacity-75">
            客服中心
          </Link>
          <Link href={APP_ROUTES.storeMap} className="min-h-11 inline-flex items-center hover:opacity-75">
            門市地址
          </Link>
          <Link href="/stores" className="min-h-11 inline-flex items-center hover:opacity-75">
            營業時間
          </Link>
          <Link href="/terms" className="min-h-11 inline-flex items-center hover:opacity-75">
            使用條款
          </Link>
          <Link href="/privacy" className="min-h-11 inline-flex items-center hover:opacity-75">
            隱私權
          </Link>
        </nav>
      </div>
    </footer>
  );
}
