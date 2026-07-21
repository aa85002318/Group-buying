import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

/** 示意圖第二層：兩欄橫向卡，高 92–112，右下珊瑚紅箭頭 */
export function FeatureDuoCards({ className }: { className?: string }) {
  return (
    <section
      aria-label="功能推薦"
      className={cn("grid grid-cols-2 gap-3", className)}
    >
      <Link
        href={APP_ROUTES.aiTools}
        className="relative flex h-[102px] items-center gap-2 overflow-hidden rounded-[18px] border border-border bg-ai-gradient px-2.5 py-2 transition duration-[180ms] hover:-translate-y-0.5"
      >
        <Image
          src="/branding/chimeidiy-app-icon.png"
          alt=""
          width={56}
          height={56}
          className="h-12 w-12 shrink-0 object-contain"
          unoptimized
        />
        <span className="min-w-0 flex-1 pr-1">
          <span className="block text-[13px] font-bold text-brand-caramel">AI 助手</span>
          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-foreground-secondary">
            不知道怎麼挑？智能推薦
          </span>
        </span>
        <span className="absolute bottom-2.5 right-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>

      <Link
        href={APP_ROUTES.storeMap}
        className="relative flex h-[102px] items-center gap-2 overflow-hidden rounded-[18px] border border-border bg-store-gradient px-2.5 py-2 transition duration-[180ms] hover:-translate-y-0.5"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-yellow text-brand-primary">
          <MapPin className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 pr-1">
          <span className="block text-[13px] font-bold text-brand-caramel">門市地圖</span>
          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-foreground-secondary">
            快速找到商品位置
          </span>
        </span>
        <span className="absolute bottom-2.5 right-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>
    </section>
  );
}
