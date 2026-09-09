"use client";

import { DesktopStores } from "@/components/desktop/DesktopStores";
import { DesktopV2Gate } from "@/components/desktop/DesktopV2Gate";
import StoresPageMobile from "./StoresPageMobile";

export function StoresPageClient() {
  return (
    <DesktopV2Gate
      mobile={
        <div className="p-[15px]">
          <StoresPageMobile />
        </div>
      }
      desktop={<DesktopStores />}
    />
  );
}
