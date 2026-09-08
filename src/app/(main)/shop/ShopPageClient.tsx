"use client";

import { DesktopShop } from "@/components/desktop/DesktopShop";
import { DesktopV2Gate } from "@/components/desktop/DesktopV2Gate";
import { ShopHubClient } from "./ShopHubClient";

export function ShopPageClient() {
  return <DesktopV2Gate mobile={<ShopHubClient />} desktop={<DesktopShop />} />;
}
