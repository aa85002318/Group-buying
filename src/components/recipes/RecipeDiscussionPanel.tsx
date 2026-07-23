"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ImagePlus, MessageCircle, X } from "lucide-react";
import type {
  RecipeDiscussion,
  RecipeDiscussionCategory,
  RecipeDiscussionReply,
  RecipeStep,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";

type ProfileMini = { id: string; full_name?: string | null } | null;

type DiscussionRow = RecipeDiscussion & {
  profiles?: ProfileMini;
  recipe_steps?: { id: string; step_number: number; title: string | null } | null;
};

type ReplyRow = RecipeDiscussionReply & {
  profiles?: ProfileMini;
};

const CATEGORIES: { id: RecipeDiscussionCategory | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "general", label: "一般" },
  { id: "failure", label: "失敗排查" },
  { id: "substitution", label: "替代材料" },
  { id: "oven", label: "烤箱" },
  { id: "storage", label: "保存" },
  { id: "product", label: "商品" },
  { id: "other", label: "其他" },
];

const CATEGORY_LABEL: Record<RecipeDiscussionCategory, string> = {
  general: "一般",
  failure: "失敗排查",
  substitution: "替代材料",
  oven: "烤箱",
  storage: "保存",
  product: "商品",
  other: "其他",
};

const STATUS_LABEL: Record<string, string> = {
  open: "待回覆",
  answered: "已回覆",
  resolved: "已解決",
  locked: "已鎖定",
};

type RecipeDiscussionPanelProps = {
  recipeId: string;
  steps?: RecipeStep[];
  compact?: boolean;
  className?: string;
};

function needsFoodSafetyNote(
  category: RecipeDiscussionCategory,
  title: string,
  body: string
): boolean {
  if (category === "substitution") return true;
  return /過敏/.test(title) || /過敏/.test(body);
}

async function uploadDiscussionImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "discussions");
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

export function RecipeDiscussionPanel({
  recipeId,
  steps = [],
  compact,
  className,
}: RecipeDiscussionPanelProps) {
  const [category, setCategory] = useState<RecipeDiscussionCategory | "all">("all");
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formCategory, setFormCategory] = useState<RecipeDiscussionCategory>("general");
  const [stepId, setStepId] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, ReplyRow[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyBusy, setReplyBusy] = useState<string | null>(null);

  const loginHref = useMemo(() => {
    const next =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : `/recipes`;
    return `/auth/login?next=${encodeURIComponent(next)}`;
  }, []);

  const orderedSteps = useMemo(
    () =>
      [...steps].sort(
        (a, b) => a.sort_order - b.sort_order || a.step_number - b.step_number
      ),
    [steps]
  );

  const showSafety = needsFoodSafetyNote(formCategory, title, body);

  const load = async (cat: RecipeDiscussionCategory | "all" = category) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: "40" });
      if (cat !== "all") qs.set("category", cat);
      const res = await fetch(`/api/recipes/${recipeId}/discussions?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "無法載入討論");
      setDisabled(Boolean(data.disabled));
      setDiscussions(data.discussions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法載入討論");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, category]);

  const handleAuthError = (status: number, message?: string) => {
    if (status === 401) {
      setNeedLogin(true);
      setFormMsg("請先登入後再發文或按讚");
      return true;
    }
    setFormMsg(message || "操作失敗");
    return false;
  };

  const onUploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setFormMsg(null);
    try {
      const next = [...imageUrls];
      for (const file of Array.from(files)) {
        if (next.length >= 4) break;
        next.push(await uploadDiscussionImage(file));
      }
      setImageUrls(next);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 401) setNeedLogin(true);
      setFormMsg(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const createDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category: formCategory,
          step_id: stepId || null,
          image_urls: imageUrls,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (handleAuthError(res.status, data.error)) return;
      if (!res.ok) throw new Error(data.error || "發文失敗");
      setTitle("");
      setBody("");
      setFormCategory("general");
      setStepId("");
      setImageUrls([]);
      setShowForm(false);
      setFormMsg("已送出提問");
      await load(category);
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "發文失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const likeDiscussion = async (id: string) => {
    setFormMsg(null);
    const res = await fetch(`/api/recipes/${recipeId}/discussions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discussion_id: id, action: "like" }),
    });
    const data = await res.json().catch(() => ({}));
    if (handleAuthError(res.status, data.error)) return;
    if (!res.ok) {
      setFormMsg(data.error || "按讚失敗");
      return;
    }
    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, like_count: data.discussion?.like_count ?? d.like_count + 1 }
          : d
      )
    );
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (replies[id]) return;
    setRepliesLoading(id);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/discussions/${id}/replies`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "無法載入回覆");
      setReplies((prev) => ({ ...prev, [id]: data.replies ?? [] }));
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : "無法載入回覆");
    } finally {
      setRepliesLoading(null);
    }
  };

  const postReply = async (discussionId: string) => {
    const text = (replyDrafts[discussionId] ?? "").trim();
    if (!text) return;
    setReplyBusy(discussionId);
    setFormMsg(null);
    try {
      const res = await fetch(
        `/api/recipes/${recipeId}/discussions/${discussionId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (handleAuthError(res.status, data.error)) return;
      if (!res.ok) throw new Error(data.error || "回覆失敗");
      setReplies((prev) => ({
        ...prev,
        [discussionId]: [...(prev[discussionId] ?? []), data.reply],
      }));
      setReplyDrafts((prev) => ({ ...prev, [discussionId]: "" }));
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === discussionId ? { ...d, reply_count: (d.reply_count ?? 0) + 1 } : d
        )
      );
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : "回覆失敗");
    } finally {
      setReplyBusy(null);
    }
  };

  const likeReply = async (discussionId: string, replyId: string) => {
    setFormMsg(null);
    const res = await fetch(
      `/api/recipes/${recipeId}/discussions/${discussionId}/replies`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_id: replyId, action: "like" }),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (handleAuthError(res.status, data.error)) return;
    if (!res.ok) {
      setFormMsg(data.error || "按讚失敗");
      return;
    }
    setReplies((prev) => ({
      ...prev,
      [discussionId]: (prev[discussionId] ?? []).map((r) =>
        r.id === replyId
          ? { ...r, like_count: data.reply?.like_count ?? r.like_count + 1 }
          : r
      ),
    }));
  };

  if (disabled) {
    return (
      <section className={cn("space-y-2", className)}>
        <h2 className={compact ? "text-base font-bold text-[#6B3F24]" : "text-xl font-bold text-[#6B3F24]"}>
          問題討論
        </h2>
        <p className="text-sm text-foreground-secondary">此食譜目前未開放討論。</p>
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
            問題討論
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            向老師與社群提問，失敗排查、替代材料、烤箱設定都可以。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="min-h-10 rounded-2xl bg-[#FF5A5F] px-4 text-sm font-bold text-white"
        >
          {showForm ? "收合表單" : "我要提問"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              category === c.id
                ? "bg-[#FF5A5F] text-white"
                : "border border-[#F2D8BF] bg-[#FFF9EA] text-[#6B3F24]"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {needLogin ? (
        <div className="rounded-2xl border border-[#F2D8BF] bg-[#FFF9EA] p-3 text-sm text-[#6B3F24]">
          發文、回覆與按讚需要登入。
          <Link href={loginHref} className="ml-2 font-bold text-[#FF5A5F] underline">
            前往登入
          </Link>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={createDiscussion}
          className="space-y-3 rounded-2xl border border-[#F2D8BF] bg-white p-4"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="標題"
            required
            className="w-full rounded-xl border border-[#F2D8BF] bg-[#FFF9EA]/60 px-3 py-2.5 text-sm text-[#6B3F24] outline-none focus:border-[#FF5A5F]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="描述你的狀況、烤箱型號、倍率等細節…"
            required
            rows={4}
            className="w-full rounded-xl border border-[#F2D8BF] bg-[#FFF9EA]/60 px-3 py-2.5 text-sm text-[#6B3F24] outline-none focus:border-[#FF5A5F]"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#6B3F24]">
              分類
              <select
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(e.target.value as RecipeDiscussionCategory)
                }
                className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
              >
                {(Object.keys(CATEGORY_LABEL) as RecipeDiscussionCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#6B3F24]">
              相關步驟（選填）
              <select
                value={stepId}
                onChange={(e) => setStepId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F2D8BF] bg-white px-3 py-2.5 text-sm"
              >
                <option value="">不指定</option>
                {orderedSteps.map((s) => (
                  <option key={s.id} value={s.id}>
                    步驟 {s.step_number}
                    {s.title ? ` · ${s.title}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {showSafety ? (
            <p className="rounded-xl bg-[#FFF9EA] px-3 py-2 text-xs leading-relaxed text-[#6B3F24]">
              食品安全提醒：替代材料與過敏原相關建議僅供參考，請依個人體質與專業醫師／營養師建議評估。若有嚴重過敏史，請勿自行替換關鍵原料。
            </p>
          ) : null}

          <div>
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#F2D8BF] bg-[#FFF9EA]/50 px-3 text-xs font-semibold text-[#6B3F24]">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "上傳中…" : "附加圖片（最多 4）"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                disabled={uploading || imageUrls.length >= 4}
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
                    className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#F2D8BF]"
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="64px" />
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

          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 w-full rounded-2xl bg-[#FF5A5F] text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? "送出中…" : "送出提問"}
          </button>
        </form>
      ) : null}

      {formMsg ? (
        <p className="text-center text-xs text-foreground-secondary">{formMsg}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-foreground-secondary">載入討論中…</p>
      ) : error ? (
        <p className="text-sm text-[#FF5A5F]">{error}</p>
      ) : discussions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#F2D8BF] bg-[#FFF9EA]/50 p-4 text-sm text-foreground-secondary">
          還沒有人提問，成為第一個發問的人。
        </p>
      ) : (
        <ul className="space-y-3">
          {discussions.map((d) => {
            const expanded = expandedId === d.id;
            const author = d.profiles?.full_name?.trim() || "會員";
            return (
              <li
                key={d.id}
                className="rounded-2xl border border-[#F2D8BF] bg-white p-4 text-left"
              >
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-full bg-[#FFF9EA] px-2 py-0.5 font-semibold text-[#6B3F24]">
                    {CATEGORY_LABEL[d.category] ?? d.category}
                  </span>
                  <span className="rounded-full border border-[#F2D8BF] px-2 py-0.5 text-[#6B3F24]/80">
                    {STATUS_LABEL[d.status] ?? d.status}
                  </span>
                  {d.recipe_steps ? (
                    <span className="text-foreground-secondary">
                      步驟 {d.recipe_steps.step_number}
                      {d.recipe_steps.title ? ` · ${d.recipe_steps.title}` : ""}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 font-semibold text-[#6B3F24]">{d.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{d.body}</p>
                {needsFoodSafetyNote(d.category, d.title, d.body) ? (
                  <p className="mt-2 text-[11px] text-[#6B3F24]/70">
                    ※ 替代／過敏相關討論僅供參考，請自行評估食品安全風險。
                  </p>
                ) : null}
                {(d.image_urls ?? []).length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {d.image_urls.map((url) => (
                      <div
                        key={url}
                        className="relative h-20 w-20 overflow-hidden rounded-lg bg-[#FFF9EA]"
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground-secondary">
                  <span>{author}</span>
                  <button
                    type="button"
                    onClick={() => likeDiscussion(d.id)}
                    className="inline-flex items-center gap-1 font-semibold text-[#6B3F24]"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    {d.like_count ?? 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleExpand(d.id)}
                    className="inline-flex items-center gap-1 font-semibold text-[#FF5A5F]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {d.reply_count ?? 0} 則回覆
                    {expanded ? " · 收合" : " · 展開"}
                  </button>
                </div>

                {expanded ? (
                  <div className="mt-3 space-y-3 border-t border-[#F2D8BF] pt-3">
                    {repliesLoading === d.id ? (
                      <p className="text-xs text-foreground-secondary">載入回覆…</p>
                    ) : (replies[d.id] ?? []).length === 0 ? (
                      <p className="text-xs text-foreground-secondary">尚無回覆</p>
                    ) : (
                      <ul className="space-y-2">
                        {(replies[d.id] ?? []).map((r) => (
                          <li
                            key={r.id}
                            className="rounded-xl bg-[#FFF9EA]/70 px-3 py-2 text-sm"
                          >
                            <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="font-semibold text-[#6B3F24]">
                                {r.profiles?.full_name?.trim() || "會員"}
                              </span>
                              {r.author_role === "teacher" ? (
                                <span className="rounded-full bg-[#FF5A5F] px-1.5 py-0.5 font-bold text-white">
                                  老師
                                </span>
                              ) : null}
                              {r.author_role === "official" ? (
                                <span className="rounded-full bg-[#6B3F24] px-1.5 py-0.5 font-bold text-white">
                                  官方
                                </span>
                              ) : null}
                              {r.is_best_answer ? (
                                <span className="rounded-full border border-[#FF5A5F] px-1.5 py-0.5 font-bold text-[#FF5A5F]">
                                  最佳解答
                                </span>
                              ) : null}
                              {r.is_helpful ? (
                                <span className="rounded-full border border-[#F2D8BF] px-1.5 py-0.5 text-[#6B3F24]">
                                  有幫助
                                </span>
                              ) : null}
                            </div>
                            <p className="whitespace-pre-wrap text-[#6B3F24]">{r.body}</p>
                            <button
                              type="button"
                              onClick={() => likeReply(d.id, r.id)}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B3F24]"
                            >
                              <Heart className="h-3 w-3" />
                              {r.like_count ?? 0}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {d.status !== "locked" ? (
                      <div className="flex gap-2">
                        <input
                          value={replyDrafts[d.id] ?? ""}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [d.id]: e.target.value,
                            }))
                          }
                          placeholder="寫下回覆…"
                          className="min-w-0 flex-1 rounded-xl border border-[#F2D8BF] px-3 py-2 text-sm outline-none focus:border-[#FF5A5F]"
                        />
                        <button
                          type="button"
                          disabled={replyBusy === d.id}
                          onClick={() => void postReply(d.id)}
                          className="rounded-xl bg-[#6B3F24] px-3 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {replyBusy === d.id ? "…" : "回覆"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground-secondary">此討論已鎖定</p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
