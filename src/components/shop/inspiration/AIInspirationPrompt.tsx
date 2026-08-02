"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { INSPIRATION_IP_IMAGE } from "@/lib/shop/inspiration-wall";
import { APP_ROUTES } from "@/lib/site-links";

export function AIInspirationPrompt() {
  return (
    <div className="mt-6 flex flex-col items-start gap-4 rounded-[20px] bg-[#FFF7DF] p-5 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0 flex-1">
        <h3 className="text-[18px] font-bold text-[#153E73] md:text-[20px]">
          想做什麼？告訴 AI 吧！
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#687386] md:text-[14px]">
          輸入食材、口味或製作時間，
          <br className="md:hidden" />
          AI 幫你找適合的食譜。
        </p>
        <Link
          href={APP_ROUTES.ai}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-[#FFD84D] px-5 text-[15px] font-bold text-[#153E73] transition duration-200 hover:-translate-y-px md:w-auto"
        >
          去問 AI
          <Sparkles className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={INSPIRATION_IP_IMAGE}
        alt=""
        className="mx-auto h-24 w-auto object-contain md:mx-0 md:h-28"
        aria-hidden
      />
    </div>
  );
}
