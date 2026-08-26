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
  /^(font-family|font-size|font-weight|font-style|color|background-color|line-height|letter-spacing|text-align|text-decoration|margin|margin-top|margin-bottom|margin-left|margin-right|padding|padding-top|padding-bottom|padding-left|padding-right|width|max-width|height|border|border-collapse|border-radius|border-color|border-width|border-style)$/i;

export function looksLikeHtml(value: string | null | undefined): boolean {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function decodeCssEntities(raw: string): string {
  return raw
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function isBrokenFontFamilyValue(val: string): boolean {
  const bare = val.replace(/['"]/g, "").replace(/\s+/g, " ").trim();
  if (!bare) return true;
  // leftover from quote corruption: empty, only punctuation, or "font-weight: normal"
  if (/^(;|,|\.|font-weight.*)$/i.test(bare)) return true;
  if (!/[A-Za-z\u4e00-\u9fff]/.test(bare)) return true;
  return false;
}

/**
 * Pre-pass: recover font-family values that used double quotes / &quot;
 * inside style="..." (historically corrupted by contenteditable + cleaners).
 */
export function repairBrokenFontFamilyHtml(html: string): string {
  let out = html;
  // font-family: &quot;Noto Sans TC&quot;
  out = out.replace(
    /font-family\s*:\s*&quot;([^&<>]+?)&quot;/gi,
    (_m, name: string) => `font-family: '${String(name).trim()}'`
  );
  // font-family: "Noto Sans TC" (raw double quotes in CSS text)
  out = out.replace(
    /font-family\s*:\s*"([^"]+)"/gi,
    (_m, name: string) => `font-family: '${String(name).trim()}'`
  );
  // empty leftovers: font-family: &quot;  or font-family: &quot
  out = out.replace(/font-family\s*:\s*&quot;?\s*(?=;|"|'|>|$)/gi, "");
  return out;
}

/** Normalize a CSS declarations string; drop Tailwind vars; quote-safe font-family. */
export function sanitizeInlineStyleDeclarations(raw: string): string {
  const kept: string[] = [];
  for (const part of decodeCssEntities(raw).split(";")) {
    const decl = part.trim();
    if (!decl) continue;
    const idx = decl.indexOf(":");
    if (idx <= 0) continue;
    const prop = decl.slice(0, idx).trim();
    let val = decl.slice(idx + 1).trim();
    if (!val || prop.startsWith("--") || !ALLOWED_INLINE_STYLE.test(prop)) continue;
    if (prop.toLowerCase() === "font-family") {
      val = val.replace(/"/g, "'");
      if (isBrokenFontFamilyValue(val)) continue;
    }
    kept.push(`${prop}: ${val}`);
  }
  return kept.join("; ");
}

/**
 * Rewrite every style="..." / style='...' so values never use raw " inside
 * double-quoted attributes (breaks HTML + contenteditable round-trips).
 */
function rewriteStyleAttributes(
  html: string,
  rewrite: (css: string) => string
): string {
  let i = 0;
  let out = "";
  while (i < html.length) {
    const slice = html.slice(i);
    const match = /\sstyle\s*=\s*/i.exec(slice);
    if (!match || match.index === undefined) {
      out += html.slice(i);
      break;
    }
    const abs = i + match.index;
    out += html.slice(i, abs);
    const valueStart = abs + match[0].length;
    const quote = html[valueStart];
    if (quote === '"' || quote === "'") {
      let j = valueStart + 1;
      let css = "";
      while (j < html.length && html[j] !== quote) {
        css += html[j];
        j += 1;
      }
      const cleaned = rewrite(css);
      out += cleaned ? ` style="${cleaned}"` : "";
      i = j < html.length ? j + 1 : j;
    } else {
      let j = valueStart;
      let css = "";
      while (j < html.length && !/[\s>]/.test(html[j]!)) {
        css += html[j];
        j += 1;
      }
      const cleaned = rewrite(css);
      out += cleaned ? ` style="${cleaned}"` : "";
      i = j;
    }
  }
  return out;
}

/**
 * Strip inherited Tailwind CSS variables that Chrome copies onto
 * contenteditable spans (can bloat a product intro to 200KB+ of “亂碼”).
 * Also repairs historically corrupted font-family quoting.
 */
export function cleanRichTextHtml(html: string | null | undefined): string {
  if (!html) return "";
  const repaired = repairBrokenFontFamilyHtml(sanitizeCmsHtml(html));
  return rewriteStyleAttributes(repaired, sanitizeInlineStyleDeclarations);
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
