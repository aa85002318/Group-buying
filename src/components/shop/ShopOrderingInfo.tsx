"use client";

import Link from "next/link";
import Image from "next/image";
import { CreditCard, HelpCircle, RefreshCw, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/support", label: "付款方式", icon: CreditCard },
  { href: "/support/shipping", label: "配送說明", icon: Truck },
  { href: "/support/returns", label: "退換貨政策", icon: RefreshCw },
  { href: "/faq", label: "常見問題", icon: HelpCircle },
] as const;

/**
 * Shop home — ordering guide block (image + CTA + 4 shortcuts).
 */
export function ShopOrderingInfo({ className }: { className?: string }) {
  return (
    <section
      className={cn("w-full bg-white", className)}
      aria-label="訂購須知"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="overflow-hidden rounded-[16px] bg-[#FFF6E6]">
          <div className="flex flex-col md:flex-row md:items-stretch">
            <div className="relative mx-auto aspect-square w-full max-w-[220px] shrink-0 md:mx-0 md:aspect-auto md:min-h-[240px] md:w-[280px] md:max-w-none">
              <Image
                src="/images/shop/banners/order-guide.jpg"
                alt="訂購須知"
                fill
                className="object-cover object-center"
                sizes="(max-width:768px) 220px, 280px"
              />
            </div>

            <div className="flex flex-1 flex-col justify-center gap-4 p-4 md:p-6 lg:p-8">
              <div>
                <h2 className="text-xl font-bold text-[#153E73] md:text-2xl">訂購須知</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#687386] md:text-base">
                  下單前先了解付款、配送與退換貨方式，讓購物更安心。
                </p>
              </div>

              <Link
                href="/help/order-guide"
                className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-[#FF8A3D] px-5 text-sm font-bold text-white transition hover:brightness-95"
              >
                了解更多 ＞
              </Link>

              <div className="grid grid-cols-4 gap-2 border-t border-[#F2D8BF]/60 pt-4 md:gap-3">
                {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition hover:bg-white/70"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#153E73] shadow-sm md:h-11 md:w-11">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="text-[10px] font-semibold leading-tight text-[#153E73] md:text-xs">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
