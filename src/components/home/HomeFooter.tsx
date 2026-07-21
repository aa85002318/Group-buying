import Link from "next/link";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

export function HomeFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "border-t border-divider bg-background pb-4 pt-5 text-center",
        className
      )}
    >
      <div className="home-page-inner">
        <p className="text-sm font-bold text-brand-caramel">CHIMEIDIY 烘焙生活平台</p>
        <p className="mt-1 text-xs text-foreground-secondary">
          客服服務時間 09:00–18:00 · 全台門市可取貨
        </p>
        <nav
          aria-label="頁尾連結"
          className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-brand-caramel"
        >
          <Link href={APP_ROUTES.support} className="transition hover:text-brand-primary">
            客服中心
          </Link>
          <Link href={APP_ROUTES.storeMap} className="transition hover:text-brand-primary">
            門市地址
          </Link>
          <Link href="/stores" className="transition hover:text-brand-primary">
            營業時間
          </Link>
          <Link href="/terms" className="transition hover:text-brand-primary">
            使用條款
          </Link>
          <Link href="/privacy" className="transition hover:text-brand-primary">
            隱私權
          </Link>
        </nav>
      </div>
    </footer>
  );
}
