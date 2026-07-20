/** Validate and normalize embeddable video URLs. Never accept raw iframe HTML. */

export type VideoEmbedKind = "youtube" | "facebook" | "external" | "self_hosted" | "invalid";

export type ParsedVideoEmbed = {
  kind: VideoEmbedKind;
  embedUrl: string | null;
  originalUrl: string;
  error?: string;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

function safeParseUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function youtubeEmbedFromUrl(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  let id: string | null = null;
  if (host.includes("youtu.be")) {
    id = url.pathname.replace(/^\//, "").split("/")[0] || null;
  } else if (url.pathname.startsWith("/embed/")) {
    id = url.pathname.split("/")[2] || null;
  } else if (url.pathname.startsWith("/shorts/")) {
    id = url.pathname.split("/")[2] || null;
  } else {
    id = url.searchParams.get("v");
  }

  if (!id || !/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function parseVideoEmbedUrl(raw: string | null | undefined): ParsedVideoEmbed {
  const originalUrl = (raw ?? "").trim();
  if (!originalUrl) {
    return { kind: "invalid", embedUrl: null, originalUrl, error: "請提供影片網址" };
  }

  if (/<\s*iframe/i.test(originalUrl) || /javascript:/i.test(originalUrl)) {
    return {
      kind: "invalid",
      embedUrl: null,
      originalUrl,
      error: "不接受 iframe HTML 或不安全網址",
    };
  }

  const url = safeParseUrl(originalUrl);
  if (!url) {
    return { kind: "invalid", embedUrl: null, originalUrl, error: "影片網址格式無效" };
  }

  const yt = youtubeEmbedFromUrl(url);
  if (yt) {
    return { kind: "youtube", embedUrl: yt, originalUrl };
  }

  const host = url.hostname.toLowerCase();
  if (host.includes("facebook.com") || host.includes("fb.watch")) {
    // Facebook embed reserved — expose as external open link for now
    return {
      kind: "facebook",
      embedUrl: null,
      originalUrl: url.toString(),
      error: "Facebook 影片播放器預留中，請用外部連結開啟",
    };
  }

  if (/\.(mp4|webm|m3u8)(\?|$)/i.test(url.pathname)) {
    return { kind: "self_hosted", embedUrl: url.toString(), originalUrl: url.toString() };
  }

  return { kind: "external", embedUrl: url.toString(), originalUrl: url.toString() };
}

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || `item-${Date.now()}`;
}
