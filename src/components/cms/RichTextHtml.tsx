"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { brandFontIdsInHtml } from "@/lib/branding/fonts";
import { loadBrandFonts } from "@/components/branding/loadBrandFonts";
import { cleanRichTextHtml, looksLikeHtml } from "@/lib/cms/safeHtml";

/**
 * Do not force Tailwind leading / heading font-family here.
 * globals.css sets h1–h3 to --font-heading; rich content must inherit body
 * unless the author set an inline font-family (same as admin editor).
 */
const RICH_HTML_CLASS =
  "rich-html text-sm text-[#475467] " +
  "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-extrabold " +
  "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-bold " +
  "[&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg " +
  "[&_li]:my-0.5 [&_li]:list-item " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_p]:mb-2 " +
  "[&_table]:w-full " +
  "[&_td]:border [&_td]:border-[#E8E1D7] [&_td]:p-1.5 " +
  "[&_th]:border [&_th]:border-[#E8E1D7] [&_th]:p-1.5 " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5";

/**
 * Storefront renderer for admin rich-text HTML.
 * Loads the same brand fonts as the admin editor (Google-first).
 */
export function RichTextHtml({
  html,
  className,
  asPlainFallback,
}: {
  html: string | null | undefined;
  className?: string;
  /** When content is not HTML, render as pre-wrapped plain text. */
  asPlainFallback?: boolean;
}) {
  const raw = html ?? "";
  const isHtml = looksLikeHtml(raw);
  const cleaned = isHtml ? cleanRichTextHtml(raw) : "";

  useEffect(() => {
    if (!cleaned) return;
    loadBrandFonts(brandFontIdsInHtml(cleaned));
  }, [cleaned]);

  if (!raw.trim()) return null;

  if (!isHtml) {
    if (!asPlainFallback) return null;
    return (
      <div
        className={cn("whitespace-pre-wrap text-sm text-[#475467]", className)}
        style={{ lineHeight: 1.7, fontFamily: "inherit" }}
      >
        {raw}
      </div>
    );
  }

  return (
    <div
      className={cn(RICH_HTML_CLASS, className)}
      style={{ lineHeight: 1.7, fontFamily: "inherit" }}
      dangerouslySetInnerHTML={{ __html: cleaned }}
    />
  );
}
