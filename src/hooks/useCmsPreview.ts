"use client";

import type { CmsDevice } from "@/types/cms";
import { CMS_DEVICE_SIZE } from "@/types/cms";

export function useCmsPreview(device: CmsDevice) {
  const size = CMS_DEVICE_SIZE[device];
  return {
    device,
    width: size.width,
    height: size.height,
    label: size.label,
  };
}
