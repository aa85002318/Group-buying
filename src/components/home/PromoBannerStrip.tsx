import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const PROMOS = [
  {
    href: "/shop?promo=weekly",
    title: "本週優惠",
    subtitle: "精選材料限時折扣",
    cta: "立即逛",
    tone: "coral" as const,
  },
  {
    href: "/shop?promo=free-shipping",
    title: "免運活動",
    subtitle: "滿額享免運",
    cta: "看條件",
    tone: "peach" as const,
  },
  {
    href: "/shop?promo=gift",
    title: "滿額贈",
    subtitle: "加購好禮相送",
    cta: "去選購",
    tone: "yellow" as const,
  },
  {
    href: "/shop?promo=flash",
    title: "限時折扣",
    subtitle: "倒數優惠中",
    cta: "搶購",
    tone: "peach" as const,
  },
];

const TONE = {
  coral: "bg-brand-gradient text-white",
  peach: "bg-surface-peach text-brand-caramel",
  yellow: "bg-surface-yellow text-brand-caramel",
} as const;

/** 高 105–135，非第二個 Hero */
export function PromoBannerStrip({ className }: { className?: string }) {
  return (
    <section aria-label="本週優惠" className={cn("space-y-3", className)}>
      <h2 className="text-lg font-semibold text-brand-caramel">本週優惠</h2>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none">
        {PROMOS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={cn(
              "relative flex h-[118px] w-[min(86vw,300px)] shrink-0 items-center overflow-hidden rounded-[18px] border border-border-soft px-4 py-3",
              TONE[p.tone]
            )}
          >
            <span className="relative z-10 min-w-0 flex-1">
              <span className="block text-base font-bold">{p.title}</span>
              <span
                className={cn(
                  "mt-1 block text-xs",
                  p.tone === "coral" ? "text-white/90" : "text-foreground-secondary"
                )}
              >
                {p.subtitle}
              </span>
              <span
                className={cn(
                  "mt-3 inline-flex h-8 items-center rounded-button px-3 text-xs font-bold",
                  p.tone === "coral"
                    ? "bg-white text-brand-primary"
                    : "bg-brand-primary text-white"
                )}
              >
                {p.cta}
              </span>
            </span>
            <Image
              src="/branding/chimeidiy-app-icon.png"
              alt=""
              width={72}
              height={72}
              className="relative z-10 h-[72px] w-[72px] shrink-0 object-contain opacity-95"
              unoptimized
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
