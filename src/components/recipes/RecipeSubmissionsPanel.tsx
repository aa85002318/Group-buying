"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Star, X } from "lucide-react";
import type { RecipeSubmission } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type ProfileMini = { id: string; full_name?: string | null } | null;

type SubmissionRow = RecipeSubmission & {
  profiles?: ProfileMini;
};

type RecipeSubmissionsPanelProps = {
  recipeId: string;
  compact?: boolean;
  defaultShowForm?: boolean;
  /** Show「稍後再分享」skip CTA */
  skippable?: boolean;
  onSkip?: () => void;
  className?: string;
};

const MAX_IMAGES = 5;

async function uploadSubmissionImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "submissions");
  const res = await fetch("/api/upload/recipe-media", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const err = new Error("請先登入後再保存或分享作品。") as Error & { status?: number };
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
  skippable = false,
  onSkip,
  className,
}: RecipeSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [showForm, setShowForm] = useState(defaultShowForm);
  const [msg, setMsg] = useState<string | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [sharePublic, setSharePublic] = useState(true);
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
      setMyId(data.viewer_id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法載入作品");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const publicWall = useMemo(
    () =>
      submissions.filter(
        (s) =>
          s.share_to_community === true &&
          (s.moderation_status === "approved" || s.is_teacher_pick)
      ),
    [submissions]
  );

  const myWorks = useMemo(
    () =>
      myId
        ? submissions.filter(
            (s) => s.user_id === myId && s.share_to_community === false
          )
        : [],
    [submissions, myId]
  );

  const onUploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg(null);
    try {
      const next = [...imageUrls];
      for (const file of Array.from(files)) {
        if (next.length >= MAX_IMAGES) break;
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("每張圖片不可超過 10MB");
        }
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
          note: note.trim() || null,
          success_status: "success",
          recipe_multiplier: 1,
          is_public: sharePublic,
          visibility: sharePublic ? "public" : "private",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setNeedLogin(true);
        setMsg("請先登入後再保存或分享作品。");
        return;
      }
      if (!res.ok) throw new Error(data.error || "送出失敗");

      setImageUrls([]);
      setNote("");
      setSharePublic(true);
      setShowForm(false);
      setMsg(
        sharePublic
          ? data.message || "已送出，審核通過後會公開顯示"
          : "已儲存到我的作品（僅自己可見）"
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    else window.location.href = "/recipes";
  };

  if (disabled) {
    return (
      <section className={cn("space-y-2", className)}>
        <h2
          className={
            compact ? "text-base font-bold text-[#6B3F24]" : "text-xl font-bold text-[#6B3F24]"
          }
        >
          分享你的作品
        </h2>
        <p className="text-sm text-foreground-secondary">此食譜目前未開放成品分享。</p>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      {!compact ? (
        <div>
          <h2 className="text-xl font-bold text-[#6B3F24]">分享你的作品</h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            完成了嗎？歡迎留下成品照片與製作心得。
          </p>
        </div>
      ) : null}

      {needLogin ? (
        <div className="rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA] p-3 text-sm text-[#6B3F24]">
          請先登入後再保存或分享作品。
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
              {uploading ? "上傳中…" : "＋上傳成品照片（最多 5 張，每張 ≤ 10MB）"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                disabled={uploading || imageUrls.length >= MAX_IMAGES}
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

          <label className="block text-xs font-semibold text-[#6B3F24]">
            製作心得
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="留下這次的烘焙紀錄…"
              rows={3}
              className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-[#FFF9EA]/60 px-3 py-2.5 text-sm outline-none focus:border-[#FF5A5F]"
            />
          </label>

          <fieldset className="space-y-2 text-sm text-[#6B3F24]">
            <legend className="text-xs font-semibold">分享設定</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="share-public"
                checked={sharePublic}
                onChange={() => setSharePublic(true)}
              />
              公開分享
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="share-public"
                checked={!sharePublic}
                onChange={() => setSharePublic(false)}
              />
              只限自己查看
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 w-full rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? "送出中…" : "發布作品"}
          </button>

          {skippable ? (
            <button
              type="button"
              onClick={handleSkip}
              className="min-h-10 w-full rounded-2xl border border-[#F2D8BF] text-sm font-semibold text-[#6B3F24]"
            >
              稍後再分享
            </button>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="min-h-10 rounded-2xl bg-[#FF5A5F] px-4 text-sm font-bold text-white"
          >
            ＋上傳成品照片
          </button>
          {skippable ? (
            <button
              type="button"
              onClick={handleSkip}
              className="min-h-10 rounded-2xl border border-[#F2D8BF] px-4 text-sm font-semibold text-[#6B3F24]"
            >
              稍後再分享
            </button>
          ) : null}
        </div>
      )}

      {msg ? <p className="text-center text-xs text-foreground-secondary">{msg}</p> : null}

      {loading ? (
        <p className="text-sm text-foreground-secondary">載入作品中…</p>
      ) : error ? (
        <p className="text-sm text-[#FF5A5F]">{error}</p>
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#6B3F24]">大家的作品</h3>
            {publicWall.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#F2D8BF] bg-[#FFF9EA]/50 p-4 text-sm text-foreground-secondary">
                目前還沒有公開作品，完成後來分享你的第一份成品吧。
              </p>
            ) : (
              <SubmissionGrid items={publicWall} />
            )}
          </div>
          {myWorks.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-bold text-[#6B3F24]">我的作品（僅自己可見）</h3>
              <SubmissionGrid items={myWorks} privateLabel />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function SubmissionGrid({
  items,
  privateLabel,
}: {
  items: SubmissionRow[];
  privateLabel?: boolean;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((s) => {
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
                {privateLabel ? (
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    私密
                  </span>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5 p-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-secondary">
                {!privateLabel ? <span>{author}</span> : <span>我</span>}
                <span>·</span>
                <span>{new Date(s.created_at).toLocaleDateString("zh-TW")}</span>
                {s.rating != null ? (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5 text-[#FF5A5F]">
                      <Star className="h-3 w-3 fill-current" />
                      {s.rating}
                    </span>
                  </>
                ) : null}
              </div>
              {s.note ? (
                <p className="line-clamp-2 text-xs text-foreground">{s.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
