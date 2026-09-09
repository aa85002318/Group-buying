"use client";

import { DesktopBrands } from "@/components/desktop/DesktopBrands";
import { DesktopV2Gate } from "@/components/desktop/DesktopV2Gate";
import { ThemesHubClient } from "@/components/themes/ThemesHubClient";

export function ThemesPageClient() {
  return (
    <DesktopV2Gate
      mobile={
        <div className="p-[15px]">
          <ThemesHubClient />
        </div>
      }
      desktop={<DesktopBrands />}
    />
  );
}
