import { canonicalizeAppHref } from "@/lib/site-links";

/** Validate internal paths or http(s) URLs. Reject javascript: and data: */

export function normalizeCmsHref(raw: string | null | undefined): string {
  return canonicalizeAppHref((raw ?? "").trim());
}

export function isSafeLinkUrl(raw: string | null | undefined): boolean {
  const value = normalizeCmsHref(raw);
  if (!value) return true;
  if (/^(javascript|data|vbscript):/i.test(value)) return false;
  if (value.startsWith("/")) {
    return !value.startsWith("//") && !value.includes("\\");
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Minimal HTML sanitizer for CMS content — strip scripts/handlers; keep basic tags. */
export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html) return "";
  const out = html
    .replace(/<\s*(script|iframe|object|embed|link|meta|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|link|meta|style)[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
  return out;
}

const ALLOWED_INLINE_STYLE =
  /^(font-family|font-size|font-weight|font-style|color|background-color|line-height|text-align|text-decoration|margin|margin-top|margin-bottom|margin-left|margin-right|padding|padding-top|padding-bottom|padding-left|padding-right|width|max-width|height|border|border-collapse|border-radius|border-color|border-width|border-style)$/i;

export function looksLikeHtml(value: string | null | undefined): boolean {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * Strip inherited Tailwind CSS variables that Chrome copies onto
 * contenteditable spans (can bloat a product intro to 200KB+ of “亂碼”).
 */
export function cleanRichTextHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeCmsHtml(html).replace(
    /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    (_match, _quoted: string, doubleQuoted?: string, singleQuoted?: string) => {
      const raw = doubleQuoted ?? singleQuoted ?? "";
      const kept: string[] = [];
      for (const part of raw.split(";")) {
        const decl = part.trim();
        if (!decl) continue;
        const idx = decl.indexOf(":");
        if (idx <= 0) continue;
        const prop = decl.slice(0, idx).trim();
        const val = decl.slice(idx + 1).trim();
        if (!val || prop.startsWith("--") || !ALLOWED_INLINE_STYLE.test(prop)) continue;
        kept.push(`${prop}: ${val}`);
      }
      return kept.length ? ` style="${kept.join("; ")}"` : "";
    }
  );
}

export function externalLinkProps(href: string): { target?: string; rel?: string } {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return {};
}

/** Strip all HTML tags for notification / plain-text surfaces (never trust raw HTML). */
export function stripHtmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short plain excerpt for search cards / lists. */
export function plainTextSnippet(
  html: string | null | undefined,
  maxLength = 90
): string | null {
  const text = stripHtmlToText(html);
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

