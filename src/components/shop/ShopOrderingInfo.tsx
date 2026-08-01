"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Shop home — ordering guide 5:2 banner (full artwork, no white frame).
 */
export function ShopOrderingInfo({ className }: { className?: string }) {
  return (
    <section
      className={cn("w-full bg-white", className)}
      aria-label="訂購須知"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <Link
          href="/help/order-guide"
          className="relative block aspect-[5/2] w-full overflow-hidden rounded-[16px] bg-transparent"
          aria-label="訂購須知，了解更多"
        >
          <Image
            src="/images/shop/banners/order-guide.jpg"
            alt="商品訂購須知"
            fill
            className="object-cover object-center"
            sizes="(max-width:1200px) 100vw, 1200px"
            priority={false}
          />
        </Link>
      </div>
    </section>
  );
}
