"use client";

import {
  CmsLinkPicker,
  type CmsLinkValue,
} from "@/components/admin/home/CmsLinkPicker";

/**
 * Unified LinkPicker for canvas CMS (Phase 3).
 * Reuses CmsLinkPicker (debounce product/recipe search already built-in).
 */
export function LinkPicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value?: CmsLinkValue | null;
  onChange: (next: CmsLinkValue) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <CmsLinkPicker value={value} onChange={onChange} className={className} />
    </div>
  );
}

export type { CmsLinkValue };
