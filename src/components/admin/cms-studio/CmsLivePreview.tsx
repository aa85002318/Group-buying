"use client";

import { useMemo, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CmsDeviceSwitcher } from "./CmsDeviceSwitcher";
import { CMS_DEVICE_SIZE, type CmsDevice } from "./types";

export type CmsPreviewScale = 0.5 | 0.75 | 1 | "fit";

/**
 * Live preview frame — prefers iframe of real storefront routes.
 * Reload only when `reloadKey` changes (after save / reorder), not on every keystroke.
 */
export function CmsLivePreview({
  src,
  reloadKey,
  device,
  onDeviceChange,
  fullPreviewHref,
  highlightLabel,
  className,
  title = "即時預覽",
}: {
  src: string;
  reloadKey?: number | string;
  device: CmsDevice;
  onDeviceChange: (d: CmsDevice) => void;
  fullPreviewHref?: string;
  highlightLabel?: string | null;
  className?: string;
  title?: string;
}) {
  const [scale, setScale] = useState<CmsPreviewScale>("fit");
  const [localKey, setLocalKey] = useState(0);
  const size = CMS_DEVICE_SIZE[device];

  const frameStyle = useMemo(() => {
    if (scale === "fit") {
      return {
        width: "100%",
        maxWidth: size.width,
        height: Math.min(size.height, 720),
      } as const;
    }
    return {
      width: size.width * scale,
      height: size.height * scale,
    } as const;
  }, [scale, size.height, size.width]);

  const iframeKey = `${reloadKey ?? 0}-${localKey}-${device}`;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#E7EAF0] bg-white shadow-[0_4px_14px_rgba(21,62,115,0.05)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8EBF0] px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-[#153E73]">{title}</p>
          {highlightLabel ? (
            <p className="text-[11px] text-muted-foreground">選取：{highlightLabel}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <CmsDeviceSwitcher value={device} onChange={onDeviceChange} />
          <button
            type="button"
            className="rounded-md p-1.5 text-[#153E73]/60 hover:bg-[#FFFBEA]"
            aria-label="重新整理預覽"
            onClick={() => setLocalKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {fullPreviewHref ? (
            <Link
              href={fullPreviewHref}
              target="_blank"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              完整預覽
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-[#E8EBF0] px-3 py-1.5">
        <span className="text-[11px] text-muted-foreground">縮放</span>
        {([0.5, 0.75, 1, "fit"] as const).map((s) => (
          <Button
            key={String(s)}
            type="button"
            size="sm"
            variant={scale === s ? "default" : "outline"}
            className={cn(
              "h-7 px-2 text-[11px]",
              scale === s && "border-[#FFE149] bg-[#FFE149] text-[#153E73]"
            )}
            onClick={() => setScale(s)}
          >
            {s === "fit" ? "適合畫面" : `${Math.round(s * 100)}%`}
          </Button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-[#F3F5F8] p-3">
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-[#E7EAF0] bg-white shadow-lg",
            highlightLabel && "ring-2 ring-[#FFE149] ring-offset-2"
          )}
          style={frameStyle}
        >
          <iframe
            key={iframeKey}
            title={title}
            src={src}
            className="h-full w-full border-0 bg-white"
            style={
              scale === "fit"
                ? undefined
                : {
                    width: size.width,
                    height: size.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }
            }
          />
        </div>
      </div>
    </div>
  );
}

/** Alias for shared naming in the brief */
export const CmsPreviewRenderer = CmsLivePreview;
