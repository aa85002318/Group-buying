import Link from "next/link";
import { Clock, Gift, Percent, Truck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMOS = [
  {
    href: "/shop?promo=weekly",
    title: "本週優惠",
    subtitle: "精選烘焙材料限時折扣",
    accent: "最高 8 折",
    icon: Percent,
    tone: "coral" as const,
  },
  {
    href: "/shop?promo=free-shipping",
    title: "免運活動",
    subtitle: "滿額享免運送到府",
    accent: "滿額免運",
    icon: Truck,
    tone: "peach" as const,
  },
  {
    href: "/shop?promo=gift",
    title: "滿額贈",
    subtitle: "指定商品加購好禮",
    accent: "好禮相送",
    icon: Gift,
    tone: "yellow" as const,
  },
  {
    href: "/shop?promo=flash",
    title: "限時折扣",
    subtitle: "倒數優惠把握最後機會",
    accent: "限時搶購",
    icon: Zap,
    tone: "peach" as const,
  },
] as const;

const TONE = {
  coral: "bg-brand-gradient text-white",
  peach: "bg-surface-peach text-brand-caramel",
  yellow: "bg-surface-yellow text-brand-caramel",
} as const;

const ACCENT = {
  coral: "text-brand-yellow",
  peach: "text-brand-primary",
  yellow: "text-brand-primary",
} as const;

const CTA = {
  coral: "bg-white text-brand-primary",
  peach: "bg-brand-primary text-white",
  yellow: "bg-brand-primary text-white",
} as const;

export function PromoBannerStrip({ className }: { className?: string }) {
  return (
    <section aria-label="本週優惠" className={cn("space-y-3", className)}>
      <h2 className="flex items-center gap-2 text-xl font-semibold text-brand-caramel">
        <Clock className="h-5 w-5 text-brand-primary" aria-hidden />
        本週優惠
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
        {PROMOS.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.href}
              href={p.href}
              className={cn(
                "flex min-w-[220px] shrink-0 flex-col gap-2 rounded-[20px] border border-border-soft p-4 shadow-soft transition duration-[180ms] ease-out hover:-translate-y-0.5 md:min-w-0",
                TONE[p.tone]
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl",
                    p.tone === "coral" ? "bg-white/20" : "bg-white/70"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{p.title}</span>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      p.tone === "coral" ? "text-brand-yellow" : ACCENT[p.tone]
                    )}
                  >
                    {p.accent}
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "text-sm",
                  p.tone === "coral" ? "text-white/90" : "text-foreground-secondary"
                )}
              >
                {p.subtitle}
              </span>
              <span
                className={cn(
                  "mt-auto inline-flex h-9 w-fit items-center rounded-button px-3 text-xs font-bold",
                  CTA[p.tone]
                )}
              >
                看活動
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
