"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CMS_DEVICE_SIZE, type CmsDevice } from "./types";

const ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
} as const;

export function CmsDeviceSwitcher({
  value,
  onChange,
  className,
}: {
  value: CmsDevice;
  onChange: (device: CmsDevice) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {(Object.keys(CMS_DEVICE_SIZE) as CmsDevice[]).map((device) => {
        const Icon = ICONS[device];
        const active = value === device;
        return (
          <Button
            key={device}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            className={cn(
              active && "border-[#FFE149] bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
            )}
            onClick={() => onChange(device)}
          >
            <Icon className="mr-1 h-3.5 w-3.5" />
            {CMS_DEVICE_SIZE[device].label}
          </Button>
        );
      })}
    </div>
  );
}
