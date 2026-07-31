"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomeQuickServicesSettings } from "@/types/home-quick-service";

type QuickServicesHeaderProps = {
  settings: HomeQuickServicesSettings;
};

export function QuickServicesHeader({ settings }: QuickServicesHeaderProps) {
  return (
    <div className="quick-services-header mb-4 flex items-end justify-between gap-3 md:mb-5">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-[#153E73] md:text-2xl">
          {settings.title}
        </h2>
        {settings.subtitle ? (
          <p className="mt-1 hidden text-[13px] text-[#687386] min-[390px]:block md:text-sm">
            {settings.subtitle}
          </p>
        ) : null}
      </div>

      <Link
        href={settings.allServicesHref}
        className="inline-flex h-[38px] shrink-0 items-center gap-1 rounded-full border border-[#E9EDF2] bg-white px-3.5 text-sm font-semibold text-[#153E73] transition hover:opacity-80 active:scale-[0.97]"
      >
        {settings.allServicesLabel}
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
