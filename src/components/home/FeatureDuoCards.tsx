import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    href: APP_ROUTES.aiTools,
    title: "AI 助手",
    description: "不知道怎麼挑？立即體驗智能推薦",
    cta: "立即體驗",
    icon: Sparkles,
    className: "bg-ai-gradient",
    iconWell: "bg-brand-primary text-white",
  },
  {
    href: APP_ROUTES.storeMap,
    title: "門市地圖",
    description: "快速找到商品擺放位置",
    cta: "立即體驗",
    icon: MapPin,
    className: "bg-store-gradient",
    iconWell: "bg-brand-primary text-white",
  },
] as const;

export function FeatureDuoCards({ className }: { className?: string }) {
  return (
    <section aria-label="功能推薦" className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            className={cn(
              "group flex items-center gap-3 rounded-[20px] border border-border p-4 shadow-soft transition duration-200",
              "hover:-translate-y-0.5 hover:shadow-lift",
              card.className
            )}
          >
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition duration-200 group-hover:scale-105",
                card.iconWell
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-brand-caramel">{card.title}</span>
              <span className="mt-0.5 block text-sm text-foreground-secondary">
                {card.description}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-primary">
                {card.cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
