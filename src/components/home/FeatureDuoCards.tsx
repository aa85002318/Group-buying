import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    href: APP_ROUTES.aiTools,
    title: "AI 助手",
    description: "不知道怎麼挑？立即體驗智能推薦",
    shortDesc: "智能推薦",
    cta: "立即體驗",
    icon: Sparkles,
    className: "bg-ai-gradient",
  },
  {
    href: APP_ROUTES.storeMap,
    title: "門市地圖",
    description: "快速找到商品擺放位置",
    shortDesc: "找門市位置",
    cta: "立即體驗",
    icon: MapPin,
    className: "bg-store-gradient",
  },
] as const;

export function FeatureDuoCards({ className }: { className?: string }) {
  return (
    <section
      aria-label="功能推薦"
      className={cn(
        "grid grid-cols-1 gap-3 min-[360px]:grid-cols-2",
        className
      )}
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            className={cn(
              "group flex items-center gap-2.5 rounded-[20px] border border-border p-3.5 shadow-soft transition duration-[180ms] ease-out sm:gap-3 sm:p-4",
              "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(138,90,52,0.09)]",
              card.className
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white transition duration-200 group-hover:scale-105 sm:h-12 sm:w-12">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-brand-caramel sm:text-base">
                {card.title}
              </span>
              <span className="mt-0.5 hidden text-sm text-foreground-secondary min-[360px]:line-clamp-2 sm:block">
                {card.description}
              </span>
              <span className="mt-0.5 block text-xs text-foreground-secondary min-[360px]:hidden">
                {card.shortDesc}
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-primary sm:text-sm">
                {card.cta}
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white">
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
