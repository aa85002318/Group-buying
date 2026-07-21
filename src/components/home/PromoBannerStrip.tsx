import Link from "next/link";
import { Gift, Percent, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMOS = [
  {
    href: "/shop?promo=shipping",
    title: "本週優惠",
    subtitle: "精選烘焙材料限時折扣",
    icon: Percent,
  },
  {
    href: "/shop?promo=free-shipping",
    title: "免運活動",
    subtitle: "滿額享免運送到府",
    icon: Truck,
  },
  {
    href: "/shop?promo=gift",
    title: "滿額贈",
    subtitle: "指定商品加購好禮",
    icon: Gift,
  },
] as const;

export function PromoBannerStrip({ className }: { className?: string }) {
  return (
    <section aria-label="本週優惠" className={cn("space-y-3", className)}>
      <h2 className="text-xl font-semibold text-brand-caramel">本週優惠</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-3 md:overflow-visible">
        {PROMOS.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.href}
              href={p.href}
              className="flex min-w-[220px] shrink-0 items-center gap-3 rounded-[20px] bg-brand-gradient p-4 text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift md:min-w-0"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{p.title}</span>
                <span className="mt-0.5 block text-sm text-white/90">{p.subtitle}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
