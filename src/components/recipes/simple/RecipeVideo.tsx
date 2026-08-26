"use client";

import { parseVideoEmbedUrl } from "@/lib/videos/embed";

export function RecipeVideo({ url }: { url: string | null | undefined }) {
  if (!url?.trim()) return null;
  const parsed = parseVideoEmbedUrl(url);
  if (!parsed.embedUrl) {
    return (
      <p className="rounded-xl border border-[#F16458]/30 bg-[#F16458]/10 px-3 py-2 text-sm text-[#F16458]">
        無法解析影片網址
      </p>
    );
  }

  if (parsed.kind === "youtube" || parsed.kind === "external" || parsed.kind === "facebook") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={parsed.embedUrl}
          title="食譜影片"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <video
        src={parsed.embedUrl}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
