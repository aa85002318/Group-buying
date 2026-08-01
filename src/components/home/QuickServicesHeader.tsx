"use client";

import type { HomeQuickServicesSettings } from "@/types/home-quick-service";

type QuickServicesHeaderProps = {
  settings: HomeQuickServicesSettings;
};

export function QuickServicesHeader({ settings }: QuickServicesHeaderProps) {
  return (
    <div className="quick-services-header mb-4 md:mb-5">
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
    </div>
  );
}
