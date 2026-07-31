"use client";

import { cn } from "@/lib/utils";
import { HOME_CMS_BRAND_SWATCHES } from "@/components/admin/home/brand-swatches";

export { HOME_CMS_BRAND_SWATCHES };

export const HOME_CMS_COLOR_SWATCHES = HOME_CMS_BRAND_SWATCHES.map((s) => s.hex);

export function ColorSwatchPicker({
  value,
  onChange,
  label = "底色",
}: {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  const current = value?.trim() || "#FFFFFF";
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {HOME_CMS_BRAND_SWATCHES.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={`${c.name} ${c.hex}`}
            aria-label={`選擇色票 ${c.name}`}
            aria-pressed={current.toLowerCase() === c.hex.toLowerCase()}
            className={cn(
              "h-7 w-7 rounded-full border border-border shadow-sm transition",
              current.toLowerCase() === c.hex.toLowerCase() &&
                "ring-2 ring-[#153E73] ring-offset-1"
            )}
            style={{ backgroundColor: c.hex }}
            onClick={() => onChange(c.hex)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(current) ? current : "#FFFFFF"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-white p-0.5"
          aria-label="自訂顏色"
        />
        <input
          type="text"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="input-field h-8 flex-1 text-xs"
          placeholder="#FFFFFF"
        />
      </div>
    </div>
  );
}
