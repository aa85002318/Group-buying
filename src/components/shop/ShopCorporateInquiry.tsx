"use client";

import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  "專人服務",
  "彈性報價",
  "快速回覆",
  "統一發票",
] as const;

/**
 * Shop home — corporate / bulk inquiry banner.
 */
export function ShopCorporateInquiry({ className }: { className?: string }) {
  return (
    <section
      className={cn("w-full bg-white", className)}
      aria-label="企業訂購詢問"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="overflow-hidden rounded-[16px] bg-[#FFF1F3]">
          <div className="flex flex-col-reverse md:flex-row md:items-stretch">
            <div className="flex flex-1 flex-col justify-center gap-4 p-4 md:p-6 lg:p-8">
              <div>
                <h2 className="text-xl font-bold text-[#153E73] md:text-2xl">企業訂購詢問</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#687386] md:text-base">
                  大宗採購、福委方案與客製合作，專人為您報價服務。
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-2 sm:gap-3">
                {HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm font-semibold text-[#153E73]"
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF8A3D] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/contact/business"
                className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-[#FF8A3D] px-5 text-sm font-bold text-white transition hover:brightness-95"
              >
                立即詢問 ＞
              </Link>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[220px] shrink-0 md:mx-0 md:aspect-auto md:min-h-[240px] md:w-[280px] md:max-w-none">
              <Image
                src="/images/shop/banners/corporate.jpg"
                alt="企業訂購"
                fill
                className="object-cover object-center"
                sizes="(max-width:768px) 220px, 280px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
