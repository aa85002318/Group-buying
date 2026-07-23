"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, HelpCircle, Loader2, X } from "lucide-react";
import type { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export type StoryAskContext = {
  storyPageId: string;
  chapterId?: string | null;
  stepId?: string | null;
  title?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  recipe: Recipe;
  context: StoryAskContext;
};

/**
 * Per-page / per-step teacher question (replaces “問 AI” for Story Book V3).
 * Posts to recipe discussions with optional photo.
 */
export function StoryAskTeacherSheet({ open, onClose, recipe, context }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuestion("");
    setPhotoUrl(null);
    setError(null);
    setDone(false);
  }, [open, context.storyPageId]);

  const heading = useMemo(() => {
    if (context.title) return context.title;
    return "製作提問";
  }, [context.title]);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "discussions");
      const res = await fetch("/api/upload/recipe-media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上傳失敗");
      setPhotoUrl(data.url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const text = question.trim();
    if (!text) {
      setError("請填寫問題");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: heading.slice(0, 80),
          body: text,
          step_id: context.stepId || null,
          story_page_id: context.storyPageId || null,
          image_urls: photoUrl ? [photoUrl] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送出失敗");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 sm:items-center">
      <div
        className={cn(
          "flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white text-[#3D2914] sm:rounded-3xl"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#F2D8BF] px-4 py-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#FF5A5F]" />
            <div>
              <p className="text-sm font-bold">我要提問</p>
              <p className="text-[11px] text-[#6B3F24]/70">{heading}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#FFF9EA]"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="space-y-4 p-6 text-center">
            <p className="text-base font-bold">已送出給老師</p>
            <p className="text-sm text-[#6B3F24]/80">
              老師回覆後會通知你。可在問題討論區查看進度。
            </p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 w-full rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white"
            >
              知道了
            </button>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto p-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#6B3F24]/70">問題</span>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA] px-3 py-2 text-sm outline-none focus:border-[#FF5A5F]"
                placeholder="例如：我的麵糊這樣可以嗎？"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </label>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[#6B3F24]/70">上傳照片（選填）</p>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="提問照片"
                  className="h-36 w-full rounded-2xl object-cover"
                />
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPhoto(f);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#F2D8BF] px-4 text-sm font-semibold"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {photoUrl ? "更換照片" : "＋ 上傳照片"}
              </button>
            </div>

            {error ? <p className="text-xs text-[#FF5A5F]">{error}</p> : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              送出
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
