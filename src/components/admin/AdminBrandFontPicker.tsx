"use client";

import React, { useEffect } from "react";
import {
  BRAND_FONT_OPTIONS,
  type BrandFontId,
} from "@/lib/branding";
import { loadAllBrandGoogleFonts } from "@/components/branding/loadBrandFonts";
import { cn } from "@/lib/utils";

/** Ensure Google Fonts CSS is loaded once for admin font pickers / editors. */
export function useBrandFontPreviewCss() {
  useEffect(() => {
    loadAllBrandGoogleFonts();
  }, []);
}

type AdminBrandFontPickerProps = {
  label: string;
  value: BrandFontId | null | undefined;
  onChange: (id: BrandFontId | null) => void;
  /** null = follow site branding default */
  allowSiteDefault?: boolean;
  siteDefaultLabel?: string;
};

export function AdminBrandFontPicker({
  label,
  value,
  onChange,
  allowSiteDefault = false,
  siteDefaultLabel = "跟隨全站品牌字型",
}: AdminBrandFontPickerProps) {
  useBrandFontPreviewCss();
  const current = value ?? null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-coffee">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {allowSiteDefault && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              "rounded-[14px] border p-3 text-left transition",
              current === null
                ? "border-[#FFE149] bg-[#FFF5C7]"
                : "border-[#E9DED4] bg-white hover:bg-[#FFFBEA]"
            )}
          >
            <p className="text-xs font-semibold text-[#153E73]">{siteDefaultLabel}</p>
            <p className="mt-2 text-base text-[#2F2925]">使用品牌設定的標題／內文字型</p>
            <p className="mt-1 text-[11px] text-[#756B64]">default</p>
          </button>
        )}
        {BRAND_FONT_OPTIONS.map((opt) => {
          const selected = current === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-[14px] border p-3 text-left transition",
                selected
                  ? "border-[#FFE149] bg-[#FFF5C7]"
                  : "border-[#E9DED4] bg-white hover:bg-[#FFFBEA]"
              )}
            >
              <p className="text-xs font-semibold text-[#153E73]">{opt.label}</p>
              <p className="mt-2 text-base text-[#2F2925]" style={{ fontFamily: opt.family }}>
                {opt.sample}
              </p>
              <p className="mt-1 text-[11px] text-[#756B64]">{opt.category}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Compact select for rich-text toolbars. */
export function AdminBrandFontSelect({
  onChange,
  placeholder = "字型",
  onMouseDown,
}: {
  onChange: (id: BrandFontId) => void;
  placeholder?: string;
  onMouseDown?: React.MouseEventHandler<HTMLSelectElement>;
}) {
  useBrandFontPreviewCss();

  return (
    <select
      className="max-w-[10rem] rounded border border-border bg-white px-2 py-1 text-xs"
      defaultValue=""
      onMouseDown={onMouseDown}
      onChange={(e) => {
        if (e.target.value) {
          onChange(e.target.value as BrandFontId);
          e.target.value = "";
        }
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {BRAND_FONT_OPTIONS.filter((f) => f.id !== "system").map((f) => (
        <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>
          {f.label}
        </option>
      ))}
    </select>
  );
}
