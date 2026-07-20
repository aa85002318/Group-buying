"use client";

import { useMemo, useState } from "react";
import { parseVideoEmbedUrl } from "@/lib/videos/embed";

type VideoEmbedProps = {
  url: string;
  title?: string;
  className?: string;
};

export function VideoEmbed({ url, title = "影音播放", className }: VideoEmbedProps) {
  const parsed = useMemo(() => parseVideoEmbedUrl(url), [url]);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (parsed.kind === "invalid" || (!parsed.embedUrl && parsed.kind !== "facebook" && parsed.kind !== "external")) {
    return (
      <div
        className={`flex aspect-video flex-col items-center justify-center gap-2 rounded-[18px] bg-surface-soft px-4 text-center ${className ?? ""}`}
      >
        <p className="text-sm font-medium text-caramel">無法播放此影片</p>
        <p className="text-xs text-foreground-secondary">{parsed.error ?? "請確認影片網址"}</p>
      </div>
    );
  }

  if (parsed.kind === "facebook" || parsed.kind === "external") {
    return (
      <div
        className={`flex aspect-video flex-col items-center justify-center gap-3 rounded-[18px] border border-border-soft bg-surface px-4 text-center ${className ?? ""}`}
      >
        <p className="text-sm text-foreground-secondary">
          {parsed.kind === "facebook" ? "Facebook 影片播放器預留中" : "此為外部影片連結"}
        </p>
        <a
          href={parsed.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          在新分頁開啟影片 →
        </a>
      </div>
    );
  }

  if (parsed.kind === "self_hosted" && parsed.embedUrl) {
    return (
      <div className={`relative aspect-video overflow-hidden rounded-[18px] bg-black ${className ?? ""}`}>
        {!loaded && !errored && (
          <div className="absolute inset-0 animate-pulse bg-surface-soft" aria-hidden />
        )}
        {errored ? (
          <div className="flex h-full items-center justify-center text-sm text-white">影片載入失敗</div>
        ) : (
          <video
            src={parsed.embedUrl}
            controls
            className="h-full w-full"
            title={title}
            onLoadedData={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative aspect-video overflow-hidden rounded-[18px] bg-black ${className ?? ""}`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-soft">
          <span className="text-sm text-foreground-secondary">載入影片中…</span>
        </div>
      )}
      {errored ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-white">
          <p className="text-sm">影片載入失敗</p>
          <a
            href={parsed.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            改用外部連結開啟
          </a>
        </div>
      ) : (
        <iframe
          src={parsed.embedUrl!}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
