"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Star, X } from "lucide-react";
import type {
  RecipeSubmission,
  RecipeSubmissionSuccessStatus,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";

type ProfileMini = { id: string; full_name?: string | null } | null;

type SubmissionRow = RecipeSubmission & {
  profiles?: ProfileMini;
};

const SUCCESS_OPTIONS: { id: RecipeSubmissionSuccessStatus; label: string }[] = [
  { id: "success", label: "成功" },
  { id: "partially_successful", label: "部分成功" },
  { id: "needs_improvement", label: "待改進" },
];

const SUCCESS_LABEL: Record<RecipeSubmissionSuccessStatus, string> = {
  success: "成功",
  partially_successful: "部分成功",
  needs_improvement: "待改進",
};

type RecipeSubmissionsPanelProps = {
  recipeId: string;
  compact?: boolean;
  /** Open upload form on mount (e.g. finish-page CTA). */
  defaultShowForm?: boolean;
  className?: string;
};

async function uploadSubmissionImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "submissions");
  const res = await fetch("/api/upload/recipe-media", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const err = new Error("請先登入") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || "圖片上傳失敗");
  return String(data.url);
}

export function RecipeSubmissionsPanel({
  recipeId,
  compact,
  defaultShowForm = false,
  className,
}: RecipeSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [showForm, setShowForm] = useState(defaultShowForm);
  const [msg, setMsg] = useState<string | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(5);
  const [successStatus, setSuccessStatus] =
    useState<RecipeSubmissionSuccessStatus>("success");
  const [multiplier, setMultiplier] = useState(1);
  const [moldSize, setMoldSize] = useState("");
  const [ovenSettings, setOvenSettings] = useState("");
  const [substitutions, setSubstitutions] = useState("");
  const [madeOn, setMadeOn] = useState("");
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loginHref = useMemo(() => {
    const next =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : `/recipes`;
    return `/auth/login?next=${encodeURIComponent(next)}`;
  }, []);

  useEffect(() => {
    setShowForm(defaultShowForm);
  }, [defaultShowForm]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/submissions`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "無法載入作品");
      setDisabled(Boolean(data.disabled));
      setSubmissions(data.submissions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法載入作品");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const onUploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg(null);
    try {
      const next = [...imageUrls];
      for (const file of Array.from(files)) {
        if (next.length >= 6) break;
        next.push(await uploadSubmissionImage(file));
      }
      setImageUrls(next);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 401) setNeedLogin(true);
      setMsg(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrls.length < 1) {
      setMsg("請至少上傳 1 張成品照片");
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_urls: imageUrls,
          title: title.trim() || null,
          note: note.trim() || null,
          rating,
          success_status: successStatus,
          recipe_multiplier: multiplier,
          mold_size: moldSize.trim() || null,
          oven_settings: ovenSettings.trim() || null,
          substitutions: substitutions.trim() || null,
          made_on: madeOn || null,
          share_to_community: shareToCommunity,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setNeedLogin(true);
        setMsg("請先登入後再上傳作品");
        return;
      }
      if (!res.ok) throw new Error(data.error || "送出失敗");

      setImageUrls([]);
      setTitle("");
      setNote("");
      setRating(5);
      setSuccessStatus("success");
      setMultiplier(1);
      setMoldSize("");
      setOvenSettings("");
      setSubstitutions("");
      setMadeOn("");
      setShareToCommunity(false);
      setShowForm(false);

      let communityNote = "";
      if (shareToCommunity && data.community && !data.community.ok) {
        communityNote = "（社群同步稍後開放，作品仍已送審）";
      }
      setMsg((data.message || "已送出，審核通過後會公開顯示") + communityNote);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  if (disabled) {
    return (
      <section className={cn("space-y-2", className)}>
        <h2 className={compact ? "text-base font-bold text-[#6B3F24]" : "text-xl font-bold text-[#6B3F24]"}>
          成品分享
        </h2>
        <p className="text-sm text-foreground-secondary">此食譜目前未開放成品分享。</p>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            className={
              compact ? "text-base font-bold text-[#6B3F24]" : "text-xl font-bold text-[#6B3F24]"
            }
          >
            成品分享
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            上傳你的成品照片，與大家分享倍率、模具與烤箱心得。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="min-h-10 rounded-2xl bg-[#FF5A5F] px-4 text-sm font-bold text-white"
        >
          {showForm ? "收合表單" : "上傳作品"}
        </button>
      </div>

      {needLogin ? (
        <div className="rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA] p-3 text-sm text-[#6B3F24]">
          上傳成品需要登入。
          <Link href={loginHref} className="ml-2 font-bold text-[#FF5A5F] underline">
            前往登入
          </Link>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-2xl border border-[#F2D8BF] bg-white p-4 text-left"
        >
          <div>
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#F2D8BF] bg-[#FFF9EA]/50 px-3 text-xs font-semibold text-[#6B3F24]">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "上傳中…" : "上傳照片（1–6 張）"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                disabled={uploading || imageUrls.length >= 6}
                onChange={(e) => {
                  void onUploadImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {imageUrls.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-[#F2D8BF]"
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                    <button
                      type="button"
                      aria-label="移除圖片"
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white"
                      onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="作品標題（選填）"
            className="w-full rounded-xl border border-[#F2D8BF] bg-[#FFF9EA]/60 px-3 py-2.5 text-sm outline-none focus:border-[#FF5A5F]"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="心得筆記（選填）"
            rows={3}
            className="w-full rounded-xl border border-[#F2D8BF] bg-[#FFF9EA]/60 px-3 py-2.5 text-sm outline-none focus:border-[#FF5A5F]"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#6B3F24]">
              評分（1–5）
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1"
                    aria-label={`${n} 分`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5",
                        n <= rating ? "fill-[#FF5A5F] text-[#FF5A5F]" : "text-[#F2D8BF]"
                      )}
                    />
                  </button>
                ))}
              </div>
            </label>
            <label className="block text-xs font-semibold text-[#6B3F24]">
              成功狀態
              <select
                value={successStatus}
                onChange={(e) =>
                  setSuccessStatus(e.target.value as RecipeSubmissionSuccessStatus)
                }
                className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
              >
                {SUCCESS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#6B3F24]">
              配方倍率
              <input
                type="number"
                min={0.25}
                max={8}
                step={0.25}
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
                className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-[#6B3F24]">
              製作日期
              <input
                type="date"
                value={madeOn}
                onChange={(e) => setMadeOn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-[#6B3F24]">
              模具尺寸
              <input
                value={moldSize}
                onChange={(e) => setMoldSize(e.target.value)}
                placeholder="例如 6 吋圓模"
                className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-[#6B3F24]">
              烤箱設定
              <input
                value={ovenSettings}
                onChange={(e) => setOvenSettings(e.target.value)}
                placeholder="例如 上下火 170°C 35 分"
                className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#6B3F24]">
            替代材料
            <textarea
              value={substitutions}
              onChange={(e) => setSubstitutions(e.target.value)}
              rows={2}
              placeholder="有換料嗎？寫一下心得"
              className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-[#6B3F24]">
            <input
              type="checkbox"
              checked={shareToCommunity}
              onChange={(e) => setShareToCommunity(e.target.checked)}
              className="mt-1"
            />
            <span>
              同步分享到烘焙圈社群
              <span className="mt-0.5 block text-xs text-foreground-secondary">
                社群寫入可能尚未開放；勾選後作品仍會送審。
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 w-full rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? "送出中…" : "送出作品"}
          </button>
        </form>
      ) : null}

      {msg ? <p className="text-center text-xs text-foreground-secondary">{msg}</p> : null}

      {loading ? (
        <p className="text-sm text-foreground-secondary">載入作品中…</p>
      ) : error ? (
        <p className="text-sm text-[#FF5A5F]">{error}</p>
      ) : submissions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#F2D8BF] bg-[#FFF9EA]/50 p-4 text-sm text-foreground-secondary">
          目前還沒有公開作品，完成後來分享你的第一份成品吧。
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {submissions.map((s) => {
            const images = [...(s.recipe_submission_images ?? [])].sort(
              (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
            );
            const cover = images[0]?.image_url;
            const author = s.profiles?.full_name?.trim() || "會員";
            const pending = s.moderation_status === "pending";
            return (
              <li
                key={s.id}
                className="overflow-hidden rounded-2xl border border-[#F2D8BF] bg-white text-left"
              >
                <div className="relative aspect-[4/3] bg-[#FFF9EA]">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={s.title || "成品"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 320px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#6B3F24]/40">
                      無圖片
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {s.is_teacher_pick ? (
                      <span className="rounded-full bg-[#FF5A5F] px-2 py-0.5 text-[10px] font-bold text-white">
                        老師精選
                      </span>
                    ) : null}
                    {pending ? (
                      <span className="rounded-full bg-[#6B3F24]/85 px-2 py-0.5 text-[10px] font-bold text-white">
                        審核中
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="font-semibold text-[#6B3F24]">
                    {s.title?.trim() || "無標題作品"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-secondary">
                    <span>{author}</span>
                    <span>·</span>
                    <span>{SUCCESS_LABEL[s.success_status] ?? s.success_status}</span>
                    {s.rating != null ? (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 text-[#FF5A5F]">
                          <Star className="h-3 w-3 fill-current" />
                          {s.rating}
                        </span>
                      </>
                    ) : null}
                    <span>·</span>
                    <span>×{Number(s.recipe_multiplier ?? 1)}</span>
                  </div>
                  {s.note ? (
                    <p className="line-clamp-2 text-xs text-foreground">{s.note}</p>
                  ) : null}
                  {images.length > 1 ? (
                    <div className="flex gap-1 overflow-x-auto pt-1">
                      {images.slice(1, 5).map((img) => (
                        <div
                          key={img.id}
                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md"
                        >
                          <Image
                            src={img.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
