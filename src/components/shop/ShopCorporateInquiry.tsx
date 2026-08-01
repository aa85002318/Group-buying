"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Shop home — corporate inquiry 5:2 banner (full artwork, no white frame).
 */
export function ShopCorporateInquiry({ className }: { className?: string }) {
  return (
    <section
      className={cn("w-full bg-white", className)}
      aria-label="企業訂購詢問"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <Link
          href="/contact/business"
          className="relative block aspect-[5/2] w-full overflow-hidden rounded-[16px] bg-transparent"
          aria-label="企業訂購詢問，立即聯繫"
        >
          <Image
            src="/images/shop/banners/corporate.jpg"
            alt="企業訂購詢問"
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
