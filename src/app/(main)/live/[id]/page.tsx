"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, MessageCircle, Play, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products/ProductCard";
import { mockLivestreams } from "@/lib/mock-data";
import type { Livestream } from "@/lib/types/database";

type LiveProduct = {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  special_price?: number | null;
};

type LiveDetail = Livestream & {
  facebook_url?: string | null;
  youtube_url?: string | null;
  replay_url?: string | null;
  chat_enabled?: boolean;
  livestream_products?: Array<{
    special_price?: number | null;
    products?: LiveProduct | null;
  }>;
  products?: LiveProduct[];
};

function embedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("youtube.com/watch")) {
    const id = new URL(url).searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (url.includes("facebook.com")) return url;
  return url;
}

export default function LiveDetailPage({ params }: { params: { id: string } }) {
  const [livestream, setLivestream] = useState<LiveDetail | null>(
    (mockLivestreams.find((l) => l.id === params.id) as LiveDetail | undefined) ?? null
  );
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<Array<{ role: string; text: string }>>([
    { role: "system", text: "歡迎來到直播間！商品可於下方同步選購。" },
  ]);

  useEffect(() => {
    fetch(`/api/livestreams/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.livestream) setLivestream(d.livestream);
      })
      .catch(() => {});
  }, [params.id]);

  const playerSrc = useMemo(() => {
    if (!livestream) return null;
    if (livestream.status === "ended") {
      return embedUrl(livestream.replay_url || livestream.youtube_url || livestream.stream_url);
    }
    return embedUrl(
      livestream.youtube_url || livestream.stream_url || livestream.facebook_url || livestream.replay_url
    );
  }, [livestream]);

  if (!livestream) return <p className="py-12 text-center text-muted-foreground">載入中...</p>;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChat((c) => [...c, { role: "user", text: chatInput.trim() }]);
    setChatInput("");
    // Local-only chat placeholder — realtime will come with Phase 4.x
    setTimeout(() => {
      setChat((c) => [...c, { role: "host", text: "感謝留言！請關注下方直播商品。" }]);
    }, 500);
  };

  return (
    <div className="page-enter space-y-5 pb-8">
      <div className="relative aspect-video overflow-hidden rounded-[20px] bg-black shadow-lift">
        {playerSrc ? (
          <iframe src={playerSrc} className="h-full w-full" allowFullScreen title={livestream.title} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white">
            <Radio className="h-8 w-8" />
            <p>直播尚未開始或尚未設定播放網址</p>
          </div>
        )}
        {livestream.status === "live" && (
          <Badge variant="live" className="absolute left-3 top-3 normal-case">
            直播中
          </Badge>
        )}
        {livestream.status === "ended" && (
          <Badge variant="secondary" className="absolute left-3 top-3 normal-case">
            Replay
          </Badge>
        )}
      </div>

      <div>
        <h1 className="text-xl font-black text-coffee">{livestream.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{livestream.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {livestream.facebook_url && (
          <a href={livestream.facebook_url} target="_blank" rel="noreferrer" className="btn-secondary gap-1 text-sm">
            <ExternalLink className="h-4 w-4" /> FB Live
          </a>
        )}
        {livestream.youtube_url && (
          <a href={livestream.youtube_url} target="_blank" rel="noreferrer" className="btn-secondary gap-1 text-sm">
            <Play className="h-4 w-4" /> YouTube
          </a>
        )}
        {livestream.replay_url && (
          <a href={livestream.replay_url} target="_blank" rel="noreferrer" className="btn-ghost gap-1 text-sm">
            Replay
          </a>
        )}
      </div>

      <section className="card-surface p-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-coffee">
          <MessageCircle className="h-4 w-4 text-primary" />
          直播聊天室
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          目前為前端示範聊天室；即時同步將於後續串接。
        </p>
        <div className="mb-3 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-muted/50 p-3">
          {chat.map((m, i) => (
            <p key={i} className={`text-sm ${m.role === "user" ? "text-right text-primary" : "text-coffee"}`}>
              <span className="rounded-lg bg-white px-2 py-1 shadow-sm">{m.text}</span>
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input-field min-h-11 flex-1"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="說點什麼…"
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button type="button" className="btn-brand px-4" onClick={sendChat}>
            送出
          </button>
        </div>
      </section>

      {(() => {
        const products =
          livestream.products ??
          (livestream.livestream_products ?? [])
            .map((lp) =>
              lp.products
                ? {
                    ...lp.products,
                    special_price: lp.special_price,
                  }
                : null
            )
            .filter(Boolean);

        if (!products?.length) return null;
        return (
          <section>
            <h2 className="mb-3 section-title">直播商品</h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <ProductCard
                  key={p!.id}
                  id={p!.id}
                  name={p!.name}
                  price={Number(p!.special_price ?? p!.price)}
                  original_price={p!.original_price}
                  image_url={p!.image_url}
                  sticker="live"
                />
              ))}
            </div>
          </section>
        );
      })()}

      <Link href="/live" className="block text-center text-sm font-bold text-primary">
        ← 返回直播列表
      </Link>
    </div>
  );
}
