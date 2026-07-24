"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStoryBuilder } from "@/components/admin/recipes/AdminStoryBuilder";
import { AdminRecipeVideoUpload } from "@/components/admin/recipes/AdminRecipeVideoUpload";
import {
  DEFAULT_READER_SETTINGS,
  parseReaderSettings,
  type RecipeReaderSettings,
} from "@/lib/recipes/reader-settings";
import type {
  Recipe,
  RecipeCategory,
  RecipeDiscussion,
  RecipeDiscussionStatus,
  RecipeFaq,
  RecipeIngredient,
  RecipeMedia,
  RecipePreparation,
  RecipeProductRecommendation,
  RecipeRecommendationType,
  RecipeStep,
  RecipeStepAiPrompt,
  RecipeSubmission,
  RecipeSubmissionModerationStatus,
  RecipeTool,
  RecipeVideoMarker,
} from "@/lib/types/database";

const TABS = [
  { id: "basic", label: "基本資料" },
  { id: "flip", label: "翻頁設定" },
  { id: "media", label: "封面與完整影片" },
  { id: "storybook", label: "圖文影音教學集" },
  { id: "ingredients", label: "材料" },
  { id: "tools", label: "器具" },
  { id: "preparations", label: "前置作業" },
  { id: "steps", label: "製作步驟" },
  { id: "ai", label: "AI 設定" },
  { id: "recommendations", label: "商品推薦" },
  { id: "faq", label: "常見問題" },
  { id: "discussions", label: "學生提問" },
  { id: "submissions", label: "成品分享" },
  { id: "seo", label: "SEO 與發布" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type IngredientDraft = {
  group_name: string;
  name: string;
  amount: string;
  unit: string;
  product_id: string;
  is_required: boolean;
  substitution_notes: string;
  quantity_numeric: string;
};

type StepDraft = {
  clientKey: string;
  id?: string;
  title: string;
  description: string;
  note: string;
  chef_notes: string;
  safety_notes: string;
  duration_seconds: string;
  temperature_value: string;
  temperature_unit: string;
  timer_enabled: boolean;
  common_failures: string;
  recovery_actions: string;
  prohibited_actions: string;
  ai_enabled: boolean;
  ai_context: string;
  ai_keywords: string;
  image_url: string;
};

type ToolDraft = { name: string; notes: string; product_id: string };
type PrepDraft = { title: string; content: string };
type FaqDraft = { question: string; answer: string; is_active: boolean };

type MediaDraft = {
  id?: string;
  media_type: "image" | "video" | "keyframe";
  source_type: "upload" | "storage" | "cdn";
  url: string;
  thumbnail_url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  allow_slow_playback: boolean;
  start_seconds: string;
  end_seconds: string;
  storage_path?: string | null;
  original_filename?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  duration_seconds?: number | null;
  processing_status?: string | null;
  markers: { time_seconds: string; title: string; description: string }[];
};

type RecDraft = {
  product_id: string;
  recommendation_type: RecipeRecommendationType;
  recommendation_reason: string;
  priority: string;
};

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function arrayToLines(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.map((v) => String(v)).join("\n");
}

function newClientKey() {
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStep(partial?: Partial<StepDraft>): StepDraft {
  return {
    clientKey: newClientKey(),
    title: "",
    description: "",
    note: "",
    chef_notes: "",
    safety_notes: "",
    duration_seconds: "",
    temperature_value: "",
    temperature_unit: "C",
    timer_enabled: false,
    common_failures: "",
    recovery_actions: "",
    prohibited_actions: "",
    ai_enabled: true,
    ai_context: "",
    ai_keywords: "",
    image_url: "",
    ...partial,
  };
}

function stepFromApi(s: RecipeStep): StepDraft {
  return emptyStep({
    id: s.id,
    title: s.title ?? "",
    description: s.description ?? "",
    note: s.note ?? "",
    chef_notes: s.chef_notes ?? "",
    safety_notes: s.safety_notes ?? "",
    duration_seconds: s.duration_seconds != null ? String(s.duration_seconds) : "",
    temperature_value: s.temperature_value != null ? String(s.temperature_value) : "",
    temperature_unit: s.temperature_unit ?? "C",
    timer_enabled: Boolean(s.timer_enabled),
    common_failures: arrayToLines(s.common_failures),
    recovery_actions: arrayToLines(s.recovery_actions),
    prohibited_actions: arrayToLines(s.prohibited_actions),
    ai_enabled: s.ai_enabled !== false,
    ai_context: s.ai_context ?? "",
    ai_keywords: (s.ai_keywords ?? []).join(", "),
    image_url: s.image_url ?? "",
  });
}

function mediaFromApi(m: RecipeMedia): MediaDraft {
  const writableSource =
    m.source_type === "storage" || m.source_type === "cdn" ? m.source_type : "upload";
  return {
    id: m.id,
    media_type: m.media_type,
    source_type: writableSource,
    url: m.url ?? "",
    thumbnail_url: m.thumbnail_url ?? "",
    alt_text: m.alt_text ?? "",
    sort_order: m.sort_order,
    is_active: m.is_active,
    autoplay: m.autoplay,
    muted: m.muted,
    loop: m.loop,
    allow_slow_playback: m.allow_slow_playback,
    start_seconds: m.start_seconds != null ? String(m.start_seconds) : "",
    end_seconds: m.end_seconds != null ? String(m.end_seconds) : "",
    storage_path: m.storage_path ?? null,
    original_filename: m.original_filename ?? null,
    file_size_bytes: m.file_size_bytes ?? null,
    mime_type: m.mime_type ?? null,
    duration_seconds: m.duration_seconds ?? null,
    processing_status: m.processing_status ?? null,
    markers: (m.recipe_video_markers ?? []).map((mk: RecipeVideoMarker) => ({
      time_seconds: String(mk.time_seconds),
      title: mk.title,
      description: mk.description ?? "",
    })),
  };
}

type Props = { recipeId: string };

export function AdminRecipeEditor({ recipeId }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("basic");
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [persistedSteps, setPersistedSteps] = useState<RecipeStep[]>([]);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    cover_image: "",
    category_id: "",
    difficulty: "easy",
    prep_time: "",
    cook_time: "",
    total_time: "",
    servings: "",
    content: "",
    tips: "",
    storage_method: "",
    status: "draft",
    is_featured: false,
    seo_title: "",
    seo_description: "",
    author_label: "",
    tags: "",
    reading_mode_default: "flip" as "flip" | "full",
    flip_mode_enabled: true,
    full_reading_enabled: true,
    is_smart_recipe: false,
    ingredient_scaling_enabled: false,
    discussion_enabled: true,
    submission_enabled: true,
    ai_enabled: true,
    product_recommendation_enabled: true,
  });
  const [readerSettings, setReaderSettings] =
    useState<RecipeReaderSettings>(DEFAULT_READER_SETTINGS);

  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [tools, setTools] = useState<ToolDraft[]>([]);
  const [preparations, setPreparations] = useState<PrepDraft[]>([]);
  const [faq, setFaq] = useState<FaqDraft[]>([]);
  const [mediaList, setMediaList] = useState<MediaDraft[]>([]);
  const [recommendations, setRecommendations] = useState<RecipeProductRecommendation[]>([]);
  const [recDraft, setRecDraft] = useState<RecDraft>({
    product_id: "",
    recommendation_type: "ingredient",
    recommendation_reason: "",
    priority: "0",
  });
  const [discussions, setDiscussions] = useState<
    Array<
      RecipeDiscussion & {
        recipe_story_pages?: { id: string; title: string | null; page_type: string } | null;
        recipe_steps?: { id: string; step_number: number; title: string | null } | null;
        profiles?: { id: string; full_name: string | null } | null;
      }
    >
  >([]);
  const [teacherQuestions, setTeacherQuestions] = useState<
    Array<{
      id: string;
      question: string;
      photo_url?: string | null;
      teacher_reply?: string | null;
      replied_at?: string | null;
      student_notified_at?: string | null;
      status: string;
      created_at: string;
      story_page_id?: string | null;
      profiles?: { id: string; full_name: string | null } | null;
      recipe_story_pages?: { id: string; title: string | null; page_type: string } | null;
      recipe_steps?: { id: string; step_number: number; title: string | null } | null;
    }>
  >([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<RecipeSubmission[]>([]);
  const [aiStepId, setAiStepId] = useState("");
  const [aiPrompts, setAiPrompts] = useState<RecipeStepAiPrompt[]>([]);
  const [promptDraft, setPromptDraft] = useState({ label: "", prompt: "" });

  const loadRecipe = useCallback(async () => {
    const [detail, list] = await Promise.all([
      fetch(`/api/admin/recipes/${recipeId}`).then((r) => r.json()),
      fetch("/api/admin/recipes").then((r) => r.json()),
    ]);
    setCategories(list.categories ?? []);
    const r = detail.recipe as Recipe | undefined;
    if (!r) return;

    setForm({
      title: r.title ?? "",
      slug: r.slug ?? "",
      summary: r.summary ?? "",
      cover_image: r.cover_image ?? "",
      category_id: r.category_id ?? "",
      difficulty: r.difficulty ?? "easy",
      prep_time: r.prep_time != null ? String(r.prep_time) : "",
      cook_time: r.cook_time != null ? String(r.cook_time) : "",
      total_time: r.total_time != null ? String(r.total_time) : "",
      servings: r.servings ?? "",
      content: r.content ?? "",
      tips: r.tips ?? "",
      storage_method: r.storage_method ?? "",
      status: r.status ?? "draft",
      is_featured: Boolean(r.is_featured),
      seo_title: r.seo_title ?? "",
      seo_description: r.seo_description ?? "",
      author_label: r.author_label ?? "",
      tags: (r.tags ?? []).join(", "),
      reading_mode_default: r.reading_mode_default === "full" ? "full" : "flip",
      flip_mode_enabled: r.flip_mode_enabled !== false,
      full_reading_enabled: r.full_reading_enabled !== false,
      is_smart_recipe: Boolean(r.is_smart_recipe),
      ingredient_scaling_enabled: r.ingredient_scaling_enabled === true,
      discussion_enabled: r.discussion_enabled !== false,
      submission_enabled: r.submission_enabled !== false,
      ai_enabled: r.ai_enabled !== false,
      product_recommendation_enabled: r.product_recommendation_enabled !== false,
    });
    setReaderSettings(parseReaderSettings(r.reader_settings));

    setIngredients(
      (r.recipe_ingredients ?? []).map((ing: RecipeIngredient) => ({
        group_name: ing.group_name ?? "",
        name: ing.name,
        amount: ing.amount ?? "",
        unit: ing.unit ?? "",
        product_id: ing.product_id ?? "",
        is_required: ing.is_required !== false,
        substitution_notes: ing.substitution_notes ?? "",
        quantity_numeric: ing.quantity_numeric != null ? String(ing.quantity_numeric) : "",
      }))
    );

    const apiSteps = r.recipe_steps ?? [];
    setPersistedSteps(apiSteps);
    setSteps(apiSteps.map(stepFromApi));
    if (apiSteps[0]?.id) setAiStepId(apiSteps[0].id);

    setTools(
      (r.recipe_tools ?? []).map((t: RecipeTool) => ({
        name: t.name,
        notes: t.notes ?? "",
        product_id: t.product_id ?? "",
      }))
    );
    setPreparations(
      (r.recipe_preparations ?? []).map((p: RecipePreparation) => ({
        title: p.title ?? "",
        content: p.content ?? "",
      }))
    );
    setFaq(
      (r.recipe_faq ?? []).map((f: RecipeFaq) => ({
        question: f.question,
        answer: f.answer,
        is_active: f.is_active !== false,
      }))
    );
    setMediaList((r.recipe_media ?? []).map(mediaFromApi));
  }, [recipeId]);

  const loadRecommendations = useCallback(async () => {
    const res = await fetch(`/api/admin/recipes/${recipeId}/recommendations`);
    const data = await res.json();
    setRecommendations(data.recommendations ?? []);
  }, [recipeId]);

  const loadDiscussions = useCallback(async () => {
    const [discRes, qRes] = await Promise.all([
      fetch(`/api/admin/recipes/${recipeId}/discussions`),
      fetch(`/api/admin/recipes/${recipeId}/teacher-questions`),
    ]);
    const discData = await discRes.json();
    const qData = await qRes.json();
    setDiscussions(discData.discussions ?? []);
    setTeacherQuestions(qData.questions ?? []);
  }, [recipeId]);

  const loadSubmissions = useCallback(async () => {
    const res = await fetch(`/api/admin/recipes/${recipeId}/submissions`);
    const data = await res.json();
    setSubmissions(data.submissions ?? []);
  }, [recipeId]);

  const loadAiPrompts = useCallback(
    async (stepId: string) => {
      if (!stepId) {
        setAiPrompts([]);
        return;
      }
      const res = await fetch(
        `/api/admin/recipes/${recipeId}/ai-prompts?stepId=${encodeURIComponent(stepId)}`
      );
      const data = await res.json();
      setAiPrompts(data.prompts ?? []);
    },
    [recipeId]
  );

  useEffect(() => {
    if (!recipeId) return;
    setLoading(true);
    Promise.all([loadRecipe(), loadRecommendations(), loadDiscussions(), loadSubmissions()])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recipeId, loadRecipe, loadRecommendations, loadDiscussions, loadSubmissions]);

  useEffect(() => {
    if (tab === "ai" && aiStepId) void loadAiPrompts(aiStepId);
  }, [tab, aiStepId, loadAiPrompts]);

  const corePayload = () => ({
    title: form.title,
    slug: form.slug,
    summary: form.summary || null,
    cover_image: form.cover_image || null,
    category_id: form.category_id || null,
    difficulty: form.difficulty,
    prep_time: form.prep_time ? Number(form.prep_time) : null,
    cook_time: form.cook_time ? Number(form.cook_time) : null,
    total_time: form.total_time ? Number(form.total_time) : null,
    servings: form.servings || null,
    content: form.content || null,
    tips: form.tips || null,
    storage_method: form.storage_method || null,
    status: form.status,
    is_featured: form.is_featured,
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
    author_label: form.author_label || null,
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    reading_mode_default: form.reading_mode_default,
    flip_mode_enabled: form.flip_mode_enabled,
    full_reading_enabled: form.full_reading_enabled,
    is_smart_recipe: form.is_smart_recipe,
                ingredient_scaling_enabled: false,
    discussion_enabled: form.discussion_enabled,
    submission_enabled: form.submission_enabled,
    ai_enabled: form.ai_enabled,
    product_recommendation_enabled: form.product_recommendation_enabled,
    reader_settings: readerSettings,
  });

  const patchRecipe = async (extra: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...corePayload(), ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      alert("已儲存");
      if (extra.steps || extra.ingredients || extra.tools || extra.preparations || extra.faq) {
        await loadRecipe();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const saveBasic = () => patchRecipe();
  const saveFlip = () => patchRecipe();
  const saveSeo = () => patchRecipe();

  const saveIngredients = () =>
    patchRecipe({
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((ing, i) => ({
          group_name: ing.group_name || null,
          name: ing.name.trim(),
          amount: ing.amount || null,
          unit: ing.unit || null,
          product_id: ing.product_id || null,
          is_required: ing.is_required,
          substitution_notes: ing.substitution_notes || null,
          quantity_numeric: ing.quantity_numeric ? Number(ing.quantity_numeric) : null,
          sort_order: i,
        })),
    });

  const saveTools = () =>
    patchRecipe({
      tools: tools
        .filter((t) => t.name.trim())
        .map((t, i) => ({
          name: t.name.trim(),
          notes: t.notes || null,
          product_id: t.product_id || null,
          sort_order: i,
        })),
    });

  const savePreparations = () =>
    patchRecipe({
      preparations: preparations
        .filter((p) => p.content.trim() || p.title.trim())
        .map((p, i) => ({
          title: p.title || null,
          content: p.content,
          sort_order: i,
        })),
    });

  const saveFaq = () =>
    patchRecipe({
      faq: faq
        .filter((f) => f.question.trim())
        .map((f, i) => ({
          question: f.question.trim(),
          answer: f.answer,
          is_active: f.is_active,
          sort_order: i,
        })),
    });

  const saveSteps = () => {
    if (
      !confirm(
        "儲存步驟會重建步驟資料；步驟關聯的 AI 提示詞可能需要重新設定。確定繼續？"
      )
    ) {
      return;
    }
    return patchRecipe({
      steps: steps
        .filter((s) => s.description.trim())
        .map((s, i) => ({
          step_number: i + 1,
          sort_order: i,
          title: s.title || null,
          description: s.description,
          note: s.note || null,
          chef_notes: s.chef_notes || null,
          safety_notes: s.safety_notes || null,
          duration_seconds: s.duration_seconds ? Number(s.duration_seconds) : null,
          temperature_value: s.temperature_value ? Number(s.temperature_value) : null,
          temperature_unit: s.temperature_unit || "C",
          timer_enabled: s.timer_enabled,
          common_failures: linesToArray(s.common_failures),
          recovery_actions: linesToArray(s.recovery_actions),
          prohibited_actions: linesToArray(s.prohibited_actions),
          ai_enabled: s.ai_enabled,
          ai_context: s.ai_context || null,
          ai_keywords: s.ai_keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          image_url: s.image_url || null,
        })),
    });
  };

  const saveMediaItem = async (item: MediaDraft, index: number) => {
    if (item.media_type === "video" && !item.url.trim()) {
      alert("請先上傳影片檔案");
      return;
    }
    if (item.media_type !== "video" && !item.url.trim()) {
      alert("請填寫媒體網址或上傳圖片");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: item.id,
        media_type: item.media_type,
        source_type: item.source_type === "cdn" || item.source_type === "storage" ? item.source_type : "upload",
        url: item.url.trim(),
        thumbnail_url: item.thumbnail_url || null,
        alt_text: item.alt_text || null,
        sort_order: item.sort_order ?? index,
        is_active: item.is_active,
        autoplay: item.autoplay,
        muted: item.muted,
        loop: item.loop,
        allow_slow_playback: item.allow_slow_playback,
        start_seconds: item.start_seconds !== "" ? Number(item.start_seconds) : null,
        end_seconds: item.end_seconds !== "" ? Number(item.end_seconds) : null,
        markers: item.markers
          .filter((m) => m.title.trim())
          .map((m, i) => ({
            time_seconds: Number(m.time_seconds || 0),
            title: m.title.trim(),
            description: m.description || null,
            sort_order: i,
          })),
      };
      const res = await fetch(`/api/admin/recipes/${recipeId}/media`, {
        method: item.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "媒體儲存失敗");
      const next = [...mediaList];
      next[index] = mediaFromApi(data.media);
      setMediaList(next);
      alert("媒體已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "媒體儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const deleteMediaItem = async (item: MediaDraft, index: number) => {
    if (!confirm("確定刪除此媒體？")) return;
    if (!item.id) {
      setMediaList(mediaList.filter((_, i) => i !== index));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/recipes/${recipeId}/media?mediaId=${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "刪除失敗");
      setMediaList(mediaList.filter((_, i) => i !== index));
    } catch (e) {
      alert(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setSaving(false);
    }
  };

  const addRecommendation = async () => {
    if (!recDraft.product_id.trim()) {
      alert("請填寫 product_id");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: recDraft.product_id.trim(),
          recommendation_type: recDraft.recommendation_type,
          recommendation_reason: recDraft.recommendation_reason || null,
          priority: Number(recDraft.priority || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setRecDraft({
        product_id: "",
        recommendation_type: "ingredient",
        recommendation_reason: "",
        priority: "0",
      });
      await loadRecommendations();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setSaving(false);
    }
  };

  const updateRecommendation = async (
    rec: RecipeProductRecommendation,
    patch: Partial<RecipeProductRecommendation>
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/recommendations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rec.id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      await loadRecommendations();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  };

  const deleteRecommendation = async (id: string) => {
    if (!confirm("確定刪除此推薦？")) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/recipes/${recipeId}/recommendations?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "刪除失敗");
      await loadRecommendations();
    } catch (e) {
      alert(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setSaving(false);
    }
  };

  const updateDiscussionStatus = async (id: string, status: RecipeDiscussionStatus) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/discussions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      await loadDiscussions();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  };

  const replyAsTeacher = async (discussionId: string) => {
    const body = (replyDrafts[discussionId] ?? "").trim();
    if (!body) {
      alert("請填寫回覆內容");
      return;
    }
    setReplyingId(discussionId);
    try {
      const res = await fetch(
        `/api/recipes/${recipeId}/discussions/${discussionId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body, author_role: "teacher", is_best_answer: true }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "回覆失敗");
      setReplyDrafts((prev) => ({ ...prev, [discussionId]: "" }));
      await loadDiscussions();
    } catch (e) {
      alert(e instanceof Error ? e.message : "回覆失敗");
    } finally {
      setReplyingId(null);
    }
  };

  const replyTeacherQuestion = async (questionId: string) => {
    const body = (replyDrafts[`tq-${questionId}`] ?? "").trim();
    if (!body) {
      alert("請填寫回覆內容");
      return;
    }
    setReplyingId(questionId);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/teacher-questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: questionId, teacher_reply: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "回覆失敗");
      setReplyDrafts((prev) => ({ ...prev, [`tq-${questionId}`]: "" }));
      await loadDiscussions();
    } catch (e) {
      alert(e instanceof Error ? e.message : "回覆失敗");
    } finally {
      setReplyingId(null);
    }
  };

  const updateSubmission = async (
    id: string,
    patch: {
      moderation_status?: RecipeSubmissionModerationStatus;
      is_teacher_pick?: boolean;
    }
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/submissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      await loadSubmissions();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  };

  const addAiPrompt = async () => {
    if (!aiStepId) {
      alert("請先儲存步驟後再設定 AI 提示詞");
      return;
    }
    if (!promptDraft.label.trim() || !promptDraft.prompt.trim()) {
      alert("請填寫標籤與提示詞");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipeId}/ai-prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_id: aiStepId,
          label: promptDraft.label.trim(),
          prompt: promptDraft.prompt.trim(),
          sort_order: aiPrompts.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setPromptDraft({ label: "", prompt: "" });
      await loadAiPrompts(aiStepId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setSaving(false);
    }
  };

  const deleteAiPrompt = async (id: string) => {
    if (!confirm("確定刪除此提示詞？")) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/recipes/${recipeId}/ai-prompts?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "刪除失敗");
      await loadAiPrompts(aiStepId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">載入中…</p>;

  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={`編輯食譜：${form.title || recipeId}`}
        description="智慧食譜編輯器 — 分頁管理基本資料、翻頁、媒體、步驟與社群內容"
        actions={
          <div className="flex flex-wrap gap-2">
            {form.slug ? (
              <Link href={`/recipes/${form.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">預覽</Button>
              </Link>
            ) : null}
            <Button variant="secondary" onClick={() => router.push("/admin/recipes")}>
              返回列表
            </Button>
          </div>
        }
      />

      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2 px-1">
          {TABS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
        {tab === "basic" && (
          <section className="space-y-4">
            <AdminImageUpload
              label="封面圖"
              images={form.cover_image ? [form.cover_image] : []}
              onChange={(images) => setForm({ ...form, cover_image: images[0] ?? "" })}
              uploadFolder="recipes"
              bucket="recipe-media"
              maxImages={1}
              multiple={false}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="標題"
              />
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="Slug"
              />
              <select
                className="input-field"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">選擇分類</option>
                {categories
                  .filter((c) => c.slug !== "all")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <select
                className="input-field"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">初學</option>
                <option value="medium">進階</option>
                <option value="hard">挑戰</option>
              </select>
              <Input
                type="number"
                placeholder="準備時間（分）"
                value={form.prep_time}
                onChange={(e) => setForm({ ...form, prep_time: e.target.value })}
              />
              <Input
                type="number"
                placeholder="烘烤時間（分）"
                value={form.cook_time}
                onChange={(e) => setForm({ ...form, cook_time: e.target.value })}
              />
              <Input
                type="number"
                placeholder="總時間（分）"
                value={form.total_time}
                onChange={(e) => setForm({ ...form, total_time: e.target.value })}
              />
              <Input
                placeholder="份量"
                value={form.servings}
                onChange={(e) => setForm({ ...form, servings: e.target.value })}
              />
              <Input
                placeholder="作者標籤"
                value={form.author_label}
                onChange={(e) => setForm({ ...form, author_label: e.target.value })}
              />
              <Input
                placeholder="標籤（逗號分隔）"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <textarea
              className="input-field min-h-[72px]"
              placeholder="摘要"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
            <textarea
              className="input-field min-h-[100px]"
              placeholder="簡介"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <textarea
              className="input-field min-h-[72px]"
              placeholder="製作重點"
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
            />
            <textarea
              className="input-field min-h-[72px]"
              placeholder="保存方式"
              value={form.storage_method}
              onChange={(e) => setForm({ ...form, storage_method: e.target.value })}
            />
            <Button onClick={saveBasic} disabled={saving}>
              {saving ? "儲存中…" : "儲存基本資料"}
            </Button>
          </section>
        )}

        {tab === "flip" && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                label="智慧食譜 is_smart_recipe"
                checked={form.is_smart_recipe}
                onChange={(v) => setForm({ ...form, is_smart_recipe: v })}
              />
              <Toggle
                label="翻頁模式 flip_mode_enabled"
                checked={form.flip_mode_enabled}
                onChange={(v) => setForm({ ...form, flip_mode_enabled: v })}
              />
              <Toggle
                label="完整閱讀 full_reading_enabled"
                checked={form.full_reading_enabled}
                onChange={(v) => setForm({ ...form, full_reading_enabled: v })}
              />
              <p className="text-xs text-muted-foreground sm:col-span-2">
                V3 翻頁教材已停用材料倍率縮放（ingredient_scaling 固定關閉）。
              </p>
              <Toggle
                label="AI 協助 ai_enabled"
                checked={form.ai_enabled}
                onChange={(v) => setForm({ ...form, ai_enabled: v })}
              />
              <Toggle
                label="商品推薦 product_recommendation_enabled"
                checked={form.product_recommendation_enabled}
                onChange={(v) => setForm({ ...form, product_recommendation_enabled: v })}
              />
              <Toggle
                label="問題討論 discussion_enabled"
                checked={form.discussion_enabled}
                onChange={(v) => setForm({ ...form, discussion_enabled: v })}
              />
              <Toggle
                label="成品分享 submission_enabled"
                checked={form.submission_enabled}
                onChange={(v) => setForm({ ...form, submission_enabled: v })}
              />
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-sm font-semibold">閱讀設定</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["fullscreen", "滿版閱讀模式"],
                    ["showToc", "顯示目錄"],
                    ["listPrimaryFull", "列表主要按鈕用「翻頁閱讀」"],
                    ["showAskTeacher", "顯示提問功能"],
                    ["showChallenge", "顯示食譜挑戰"],
                    ["showCautionPopup", "顯示老師提醒（Popup）"],
                    ["showProducts", "顯示推薦商品"],
                    ["showCompletionBadge", "顯示完成徽章"],
                  ] as const
                ).map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    checked={Boolean(readerSettings[key])}
                    onChange={(v) =>
                      setReaderSettings((prev) => ({ ...prev, [key]: v }))
                    }
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-sm font-semibold">作品分享</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["showGallery", "啟用成品分享頁"],
                    ["allowPublicShare", "允許公開分享"],
                    ["allowPrivateShare", "允許私人留存"],
                    ["showPublicWall", "顯示公開作品牆"],
                  ] as const
                ).map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    checked={Boolean(readerSettings[key])}
                    onChange={(v) =>
                      setReaderSettings((prev) => ({ ...prev, [key]: v }))
                    }
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                關閉「啟用成品分享頁」後，前台目錄與閱讀器皆不顯示分享頁。
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">預設閱讀模式</p>
              <select
                className="input-field max-w-xs"
                value={form.reading_mode_default}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reading_mode_default: e.target.value === "full" ? "full" : "flip",
                  })
                }
              >
                <option value="flip">翻頁</option>
                <option value="full">完整閱讀</option>
              </select>
            </div>
            <Button onClick={saveFlip} disabled={saving}>
              {saving ? "儲存中…" : "儲存翻頁設定"}
            </Button>
          </section>
        )}

        {tab === "media" && (
          <section className="space-y-4">
            <div className="flex justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                封面圖可在「基本資料」設定；教學影片請直接上傳 MP4／WebM／MOV，不支援 YouTube。
              </p>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  setMediaList([
                    ...mediaList,
                    {
                      media_type: "video",
                      source_type: "upload",
                      url: "",
                      thumbnail_url: "",
                      alt_text: "",
                      sort_order: mediaList.length,
                      is_active: true,
                      autoplay: false,
                      muted: true,
                      loop: false,
                      allow_slow_playback: true,
                      start_seconds: "",
                      end_seconds: "",
                      markers: [],
                    },
                  ])
                }
              >
                新增影片欄位
              </Button>
            </div>
            {mediaList.length === 0 && (
              <p className="text-sm text-muted-foreground">尚無媒體 — 請上傳完整教學影片</p>
            )}
            {mediaList.map((item, idx) => (
              <div key={item.id ?? `new-${idx}`} className="space-y-2 rounded-lg border p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    className="input-field"
                    value={item.media_type}
                    onChange={(e) => {
                      const next = [...mediaList];
                      next[idx] = {
                        ...item,
                        media_type: e.target.value as MediaDraft["media_type"],
                      };
                      setMediaList(next);
                    }}
                  >
                    <option value="image">image</option>
                    <option value="video">video</option>
                    <option value="keyframe">keyframe</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="排序"
                    value={item.sort_order}
                    onChange={(e) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, sort_order: Number(e.target.value || 0) };
                      setMediaList(next);
                    }}
                  />
                  <Input
                    placeholder="alt text"
                    value={item.alt_text}
                    onChange={(e) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, alt_text: e.target.value };
                      setMediaList(next);
                    }}
                  />
                </div>

                {item.media_type === "video" ? (
                  <AdminRecipeVideoUpload
                    recipeId={recipeId}
                    mediaScope="recipe_full"
                    replaceMediaId={item.id ?? null}
                    existing={
                      item.id
                        ? {
                            id: item.id,
                            url: item.url || null,
                            thumbnail_url: item.thumbnail_url || null,
                            original_filename: item.original_filename ?? null,
                            file_size_bytes: item.file_size_bytes ?? null,
                            duration_seconds: item.duration_seconds ?? null,
                            storage_path: item.storage_path ?? null,
                            mime_type: item.mime_type ?? null,
                            is_active: item.is_active,
                            processing_status:
                              (item.processing_status as RecipeMedia["processing_status"]) ??
                              undefined,
                          }
                        : null
                    }
                    onUploaded={(media) => {
                      const next = [...mediaList];
                      next[idx] = mediaFromApi(media);
                      setMediaList(next);
                    }}
                  />
                ) : (
                  <>
                    <Input
                      placeholder="圖片／關鍵影格 URL"
                      value={item.url}
                      onChange={(e) => {
                        const next = [...mediaList];
                        next[idx] = { ...item, url: e.target.value };
                        setMediaList(next);
                      }}
                    />
                    <AdminImageUpload
                      images={item.url ? [item.url] : []}
                      onChange={(imgs) => {
                        const next = [...mediaList];
                        next[idx] = { ...item, url: imgs[0] ?? "", source_type: "upload" };
                        setMediaList(next);
                      }}
                      multiple={false}
                      maxImages={1}
                      label="上傳圖片"
                      uploadFolder={`recipes/${recipeId}/images`}
                      bucket="recipe-media"
                    />
                  </>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="片段起點（秒）"
                    value={item.start_seconds}
                    onChange={(e) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, start_seconds: e.target.value };
                      setMediaList(next);
                    }}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="片段終點（秒）"
                    value={item.end_seconds}
                    onChange={(e) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, end_seconds: e.target.value };
                      setMediaList(next);
                    }}
                  />
                </div>
                <Input
                  placeholder="縮圖／封面 URL"
                  value={item.thumbnail_url}
                  onChange={(e) => {
                    const next = [...mediaList];
                    next[idx] = { ...item, thumbnail_url: e.target.value };
                    setMediaList(next);
                  }}
                />
                <div className="flex flex-wrap gap-3">
                  <Toggle
                    label="啟用"
                    checked={item.is_active}
                    onChange={(v) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, is_active: v };
                      setMediaList(next);
                    }}
                  />
                  <Toggle
                    label="自動播放"
                    checked={item.autoplay}
                    onChange={(v) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, autoplay: v };
                      setMediaList(next);
                    }}
                  />
                  <Toggle
                    label="靜音"
                    checked={item.muted}
                    onChange={(v) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, muted: v };
                      setMediaList(next);
                    }}
                  />
                  <Toggle
                    label="循環"
                    checked={item.loop}
                    onChange={(v) => {
                      const next = [...mediaList];
                      next[idx] = { ...item, loop: v };
                      setMediaList(next);
                    }}
                  />
                </div>
                {item.media_type === "video" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">影片標記</p>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => {
                          const next = [...mediaList];
                          next[idx] = {
                            ...item,
                            markers: [
                              ...item.markers,
                              { time_seconds: "0", title: "", description: "" },
                            ],
                          };
                          setMediaList(next);
                        }}
                      >
                        新增標記
                      </Button>
                    </div>
                    {item.markers.map((mk, mi) => (
                      <div key={mi} className="grid gap-2 sm:grid-cols-3">
                        <Input
                          type="number"
                          placeholder="秒數"
                          value={mk.time_seconds}
                          onChange={(e) => {
                            const next = [...mediaList];
                            const markers = [...item.markers];
                            markers[mi] = { ...mk, time_seconds: e.target.value };
                            next[idx] = { ...item, markers };
                            setMediaList(next);
                          }}
                        />
                        <Input
                          placeholder="標題"
                          value={mk.title}
                          onChange={(e) => {
                            const next = [...mediaList];
                            const markers = [...item.markers];
                            markers[mi] = { ...mk, title: e.target.value };
                            next[idx] = { ...item, markers };
                            setMediaList(next);
                          }}
                        />
                        <Input
                          placeholder="說明"
                          value={mk.description}
                          onChange={(e) => {
                            const next = [...mediaList];
                            const markers = [...item.markers];
                            markers[mi] = { ...mk, description: e.target.value };
                            next[idx] = { ...item, markers };
                            setMediaList(next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void saveMediaItem(item, idx)} disabled={saving}>
                    儲存設定
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void deleteMediaItem(item, idx)}
                    disabled={saving}
                  >
                    刪除
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "storybook" && (
          <AdminStoryBuilder
            recipeId={recipeId}
            recipeMedia={mediaList}
            steps={persistedSteps}
          />
        )}

        {tab === "ingredients" && (
          <section className="space-y-3">
            <div className="flex justify-between">
              <h3 className="font-medium">材料</h3>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  setIngredients([
                    ...ingredients,
                    {
                      group_name: "材料",
                      name: "",
                      amount: "",
                      unit: "",
                      product_id: "",
                      is_required: true,
                      substitution_notes: "",
                      quantity_numeric: "",
                    },
                  ])
                }
              >
                新增
              </Button>
            </div>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border p-3">
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  <Input
                    placeholder="分組"
                    value={ing.group_name}
                    onChange={(e) => {
                      const n = [...ingredients];
                      n[idx] = { ...ing, group_name: e.target.value };
                      setIngredients(n);
                    }}
                  />
                  <Input
                    placeholder="名稱"
                    value={ing.name}
                    onChange={(e) => {
                      const n = [...ingredients];
                      n[idx] = { ...ing, name: e.target.value };
                      setIngredients(n);
                    }}
                  />
                  <Input
                    placeholder="用量"
                    value={ing.amount}
                    onChange={(e) => {
                      const n = [...ingredients];
                      n[idx] = { ...ing, amount: e.target.value };
                      setIngredients(n);
                    }}
                  />
                  <Input
                    placeholder="單位"
                    value={ing.unit}
                    onChange={(e) => {
                      const n = [...ingredients];
                      n[idx] = { ...ing, unit: e.target.value };
                      setIngredients(n);
                    }}
                  />
                  <Input
                    placeholder="數值 quantity"
                    value={ing.quantity_numeric}
                    onChange={(e) => {
                      const n = [...ingredients];
                      n[idx] = { ...ing, quantity_numeric: e.target.value };
                      setIngredients(n);
                    }}
                  />
                  <Input
                    placeholder="product_id"
                    value={ing.product_id}
                    onChange={(e) => {
                      const n = [...ingredients];
                      n[idx] = { ...ing, product_id: e.target.value };
                      setIngredients(n);
                    }}
                  />
                </div>
                <Input
                  placeholder="替代說明"
                  value={ing.substitution_notes}
                  onChange={(e) => {
                    const n = [...ingredients];
                    n[idx] = { ...ing, substitution_notes: e.target.value };
                    setIngredients(n);
                  }}
                />
                <div className="flex items-center justify-between">
                  <Toggle
                    label="必要材料"
                    checked={ing.is_required}
                    onChange={(v) => {
                      const n = [...ingredients];
                      n[idx] = { ...ing, is_required: v };
                      setIngredients(n);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                  >
                    刪除
                  </Button>
                </div>
              </div>
            ))}
            <Button onClick={saveIngredients} disabled={saving}>
              {saving ? "儲存中…" : "儲存材料"}
            </Button>
          </section>
        )}

        {tab === "tools" && (
          <section className="space-y-3">
            <div className="flex justify-between">
              <h3 className="font-medium">器具</h3>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setTools([...tools, { name: "", notes: "", product_id: "" }])}
              >
                新增
              </Button>
            </div>
            {tools.map((tool, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="名稱"
                  value={tool.name}
                  onChange={(e) => {
                    const n = [...tools];
                    n[idx] = { ...tool, name: e.target.value };
                    setTools(n);
                  }}
                />
                <Input
                  placeholder="備註"
                  value={tool.notes}
                  onChange={(e) => {
                    const n = [...tools];
                    n[idx] = { ...tool, notes: e.target.value };
                    setTools(n);
                  }}
                />
                <Input
                  placeholder="product_id"
                  value={tool.product_id}
                  onChange={(e) => {
                    const n = [...tools];
                    n[idx] = { ...tool, product_id: e.target.value };
                    setTools(n);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setTools(tools.filter((_, i) => i !== idx))}
                >
                  刪除
                </Button>
              </div>
            ))}
            <Button onClick={saveTools} disabled={saving}>
              {saving ? "儲存中…" : "儲存器具"}
            </Button>
          </section>
        )}

        {tab === "preparations" && (
          <section className="space-y-3">
            <div className="flex justify-between">
              <h3 className="font-medium">前置作業</h3>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setPreparations([...preparations, { title: "", content: "" }])}
              >
                新增
              </Button>
            </div>
            {preparations.map((prep, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border p-3">
                <Input
                  placeholder="標題"
                  value={prep.title}
                  onChange={(e) => {
                    const n = [...preparations];
                    n[idx] = { ...prep, title: e.target.value };
                    setPreparations(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[72px]"
                  placeholder="內容"
                  value={prep.content}
                  onChange={(e) => {
                    const n = [...preparations];
                    n[idx] = { ...prep, content: e.target.value };
                    setPreparations(n);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setPreparations(preparations.filter((_, i) => i !== idx))}
                >
                  刪除
                </Button>
              </div>
            ))}
            <Button onClick={savePreparations} disabled={saving}>
              {saving ? "儲存中…" : "儲存前置作業"}
            </Button>
          </section>
        )}

        {tab === "steps" && (
          <section className="space-y-3">
            <div className="flex justify-between">
              <h3 className="font-medium">製作步驟</h3>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setSteps([...steps, emptyStep()])}
              >
                新增步驟
              </Button>
            </div>
            {steps.map((step, idx) => (
              <div key={step.clientKey} className="space-y-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">步驟 {idx + 1}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        const copy = emptyStep({
                          ...step,
                          clientKey: newClientKey(),
                          id: undefined,
                          title: step.title ? `${step.title}（複製）` : "",
                        });
                        const next = [...steps];
                        next.splice(idx + 1, 0, copy);
                        setSteps(next);
                      }}
                    >
                      複製
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        if (!confirm(`確定刪除步驟 ${idx + 1}？`)) return;
                        setSteps(steps.filter((_, i) => i !== idx));
                      }}
                    >
                      刪除
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="標題"
                  value={step.title}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, title: e.target.value };
                    setSteps(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[72px]"
                  placeholder="說明 description"
                  value={step.description}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, description: e.target.value };
                    setSteps(n);
                  }}
                />
                <Input
                  placeholder="注意事項 note"
                  value={step.note}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, note: e.target.value };
                    setSteps(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[56px]"
                  placeholder="主廚筆記 chef_notes"
                  value={step.chef_notes}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, chef_notes: e.target.value };
                    setSteps(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[56px]"
                  placeholder="安全注意 safety_notes"
                  value={step.safety_notes}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, safety_notes: e.target.value };
                    setSteps(n);
                  }}
                />
                <div className="grid gap-2 sm:grid-cols-4">
                  <Input
                    type="number"
                    placeholder="秒數 duration"
                    value={step.duration_seconds}
                    onChange={(e) => {
                      const n = [...steps];
                      n[idx] = { ...step, duration_seconds: e.target.value };
                      setSteps(n);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="溫度"
                    value={step.temperature_value}
                    onChange={(e) => {
                      const n = [...steps];
                      n[idx] = { ...step, temperature_value: e.target.value };
                      setSteps(n);
                    }}
                  />
                  <select
                    className="input-field"
                    value={step.temperature_unit}
                    onChange={(e) => {
                      const n = [...steps];
                      n[idx] = { ...step, temperature_unit: e.target.value };
                      setSteps(n);
                    }}
                  >
                    <option value="C">°C</option>
                    <option value="F">°F</option>
                  </select>
                  <Toggle
                    label="計時器"
                    checked={step.timer_enabled}
                    onChange={(v) => {
                      const n = [...steps];
                      n[idx] = { ...step, timer_enabled: v };
                      setSteps(n);
                    }}
                  />
                </div>
                <textarea
                  className="input-field min-h-[56px]"
                  placeholder="常見失敗（每行一項）"
                  value={step.common_failures}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, common_failures: e.target.value };
                    setSteps(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[56px]"
                  placeholder="補救方式（每行一項）"
                  value={step.recovery_actions}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, recovery_actions: e.target.value };
                    setSteps(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[56px]"
                  placeholder="禁止事項（每行一項）"
                  value={step.prohibited_actions}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, prohibited_actions: e.target.value };
                    setSteps(n);
                  }}
                />
                <Toggle
                  label="此步驟啟用 AI"
                  checked={step.ai_enabled}
                  onChange={(v) => {
                    const n = [...steps];
                    n[idx] = { ...step, ai_enabled: v };
                    setSteps(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[56px]"
                  placeholder="AI 情境 ai_context"
                  value={step.ai_context}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, ai_context: e.target.value };
                    setSteps(n);
                  }}
                />
                <Input
                  placeholder="AI 關鍵字（逗號分隔）"
                  value={step.ai_keywords}
                  onChange={(e) => {
                    const n = [...steps];
                    n[idx] = { ...step, ai_keywords: e.target.value };
                    setSteps(n);
                  }}
                />
                <AdminImageUpload
                  label="步驟圖片"
                  images={step.image_url ? [step.image_url] : []}
                  onChange={(images) => {
                    const n = [...steps];
                    n[idx] = { ...step, image_url: images[0] ?? "" };
                    setSteps(n);
                  }}
                  uploadFolder={`recipes/${recipeId}/steps`}
                  bucket="recipe-media"
                  maxImages={1}
                  multiple={false}
                />
              </div>
            ))}
            <Button onClick={saveSteps} disabled={saving}>
              {saving ? "儲存中…" : "儲存步驟"}
            </Button>
          </section>
        )}

        {tab === "ai" && (
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              管理各步驟的快速提示詞（需先儲存步驟以取得 step id）。食譜級 AI 開關在「翻頁設定」。
            </p>
            <select
              className="input-field max-w-md"
              value={aiStepId}
              onChange={(e) => setAiStepId(e.target.value)}
            >
              <option value="">選擇步驟</option>
              {persistedSteps.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i + 1}. {s.title || s.description.slice(0, 40) || s.id}
                </option>
              ))}
            </select>
            {!persistedSteps.length && (
              <p className="text-sm text-amber-700">尚無已儲存步驟，請先到「製作步驟」儲存。</p>
            )}
            {aiStepId && (
              <>
                <div className="space-y-2">
                  {aiPrompts.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{p.label}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.prompt}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => deleteAiPrompt(p.id)}
                        disabled={saving}
                      >
                        刪除
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="標籤 label"
                    value={promptDraft.label}
                    onChange={(e) => setPromptDraft({ ...promptDraft, label: e.target.value })}
                  />
                  <Input
                    placeholder="提示詞 prompt"
                    value={promptDraft.prompt}
                    onChange={(e) => setPromptDraft({ ...promptDraft, prompt: e.target.value })}
                  />
                </div>
                <Button onClick={addAiPrompt} disabled={saving}>
                  新增提示詞
                </Button>
              </>
            )}
          </section>
        )}

        {tab === "recommendations" && (
          <section className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="product_id"
                value={recDraft.product_id}
                onChange={(e) => setRecDraft({ ...recDraft, product_id: e.target.value })}
              />
              <select
                className="input-field"
                value={recDraft.recommendation_type}
                onChange={(e) =>
                  setRecDraft({
                    ...recDraft,
                    recommendation_type: e.target.value as RecipeRecommendationType,
                  })
                }
              >
                {(
                  [
                    "ingredient",
                    "substitute",
                    "tool",
                    "decoration",
                    "packaging",
                    "teacher_choice",
                    "upgrade",
                  ] as RecipeRecommendationType[]
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Input
                placeholder="推薦理由"
                value={recDraft.recommendation_reason}
                onChange={(e) =>
                  setRecDraft({ ...recDraft, recommendation_reason: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="priority"
                value={recDraft.priority}
                onChange={(e) => setRecDraft({ ...recDraft, priority: e.target.value })}
              />
            </div>
            <Button onClick={addRecommendation} disabled={saving}>
              新增推薦
            </Button>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {rec.products?.name ?? rec.product_id} · {rec.recommendation_type}
                    </p>
                    <p className="text-muted-foreground">
                      {rec.recommendation_reason || "—"} · priority {rec.priority}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      className="w-20"
                      type="number"
                      defaultValue={rec.priority}
                      onBlur={(e) => {
                        const priority = Number(e.target.value || 0);
                        if (priority !== rec.priority) {
                          void updateRecommendation(rec, { priority });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => deleteRecommendation(rec.id)}
                      disabled={saving}
                    >
                      刪除
                    </Button>
                  </div>
                </div>
              ))}
              {!recommendations.length && (
                <p className="text-sm text-muted-foreground">尚無商品推薦</p>
              )}
            </div>
          </section>
        )}

        {tab === "faq" && (
          <section className="space-y-3">
            <div className="flex justify-between">
              <h3 className="font-medium">常見問題</h3>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  setFaq([...faq, { question: "", answer: "", is_active: true }])
                }
              >
                新增
              </Button>
            </div>
            {faq.map((item, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border p-3">
                <Input
                  placeholder="問題"
                  value={item.question}
                  onChange={(e) => {
                    const n = [...faq];
                    n[idx] = { ...item, question: e.target.value };
                    setFaq(n);
                  }}
                />
                <textarea
                  className="input-field min-h-[72px]"
                  placeholder="答案"
                  value={item.answer}
                  onChange={(e) => {
                    const n = [...faq];
                    n[idx] = { ...item, answer: e.target.value };
                    setFaq(n);
                  }}
                />
                <div className="flex items-center justify-between">
                  <Toggle
                    label="啟用"
                    checked={item.is_active}
                    onChange={(v) => {
                      const n = [...faq];
                      n[idx] = { ...item, is_active: v };
                      setFaq(n);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                  >
                    刪除
                  </Button>
                </div>
              </div>
            ))}
            <Button onClick={saveFaq} disabled={saving}>
              {saving ? "儲存中…" : "儲存 FAQ"}
            </Button>
          </section>
        )}

        {tab === "discussions" && (
          <section className="space-y-3">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">學生提問（我要提問）</h3>
                <p className="text-sm text-muted-foreground">
                  依 Story Page 聚合；回覆後會通知學生。
                </p>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => loadDiscussions()}>
                重新整理
              </Button>
            </div>

            {teacherQuestions.map((q) => (
              <div key={q.id} className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-primary">教材提問</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {q.profiles?.full_name ? `${q.profiles.full_name} · ` : ""}
                      {q.recipe_story_pages?.title
                        ? `頁面「${q.recipe_story_pages.title}」 · `
                        : ""}
                      {q.recipe_steps
                        ? `Step ${q.recipe_steps.step_number} · `
                        : ""}
                      {new Date(q.created_at).toLocaleString("zh-TW")} · {q.status}
                      {q.student_notified_at ? " · 已通知" : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs">{q.status}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{q.question}</p>
                {q.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.photo_url}
                    alt=""
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                ) : null}
                {q.teacher_reply ? (
                  <div className="rounded-lg bg-white p-3 text-sm">
                    <p className="text-xs font-semibold text-muted-foreground">已回覆</p>
                    <p className="mt-1 whitespace-pre-wrap">{q.teacher_reply}</p>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-semibold">老師回覆</p>
                    <textarea
                      className="input-field min-h-[80px]"
                      placeholder="例如：可以，再攪拌 30 秒即可。"
                      value={replyDrafts[`tq-${q.id}`] ?? ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [`tq-${q.id}`]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      type="button"
                      disabled={replyingId === q.id}
                      onClick={() => void replyTeacherQuestion(q.id)}
                    >
                      {replyingId === q.id ? "送出中…" : "送出回覆並通知學生"}
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {discussions.map((d) => (
              <div key={d.id} className="space-y-3 rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">討論區提問</p>
                    <p className="font-medium">{d.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.profiles?.full_name ? `${d.profiles.full_name} · ` : ""}
                      {d.recipe_story_pages?.title
                        ? `頁面「${d.recipe_story_pages.title}」 · `
                        : d.story_page_id
                          ? `頁面 ${d.story_page_id.slice(0, 8)}… · `
                          : ""}
                      {d.recipe_steps
                        ? `Step ${d.recipe_steps.step_number}${d.recipe_steps.title ? ` ${d.recipe_steps.title}` : ""} · `
                        : d.step_id
                          ? `步驟 ${d.step_id.slice(0, 8)}… · `
                          : ""}
                      {d.category} · {new Date(d.created_at).toLocaleString("zh-TW")} ·{" "}
                      {d.status}
                      {d.reply_count ? ` · ${d.reply_count} 則回覆` : ""}
                    </p>
                  </div>
                  <select
                    className="input-field max-w-[140px]"
                    value={d.status}
                    onChange={(e) =>
                      updateDiscussionStatus(d.id, e.target.value as RecipeDiscussionStatus)
                    }
                    disabled={saving}
                  >
                    {(["open", "answered", "resolved", "locked", "hidden"] as const).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm whitespace-pre-wrap">{d.body}</p>
                {Array.isArray(d.image_urls) && d.image_urls.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {d.image_urls.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                <div className="space-y-2 rounded-lg bg-muted/40 p-3">
                  <p className="text-xs font-semibold">老師回覆</p>
                  <textarea
                    className="input-field min-h-[80px]"
                    placeholder="例如：可以，再攪拌 30 秒即可。"
                    value={replyDrafts[d.id] ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    type="button"
                    disabled={replyingId === d.id}
                    onClick={() => void replyAsTeacher(d.id)}
                  >
                    {replyingId === d.id ? "送出中…" : "送出回覆並通知學生"}
                  </Button>
                </div>
              </div>
            ))}
            {!teacherQuestions.length && !discussions.length && (
              <p className="text-sm text-muted-foreground">尚無提問</p>
            )}
          </section>
        )}

        {tab === "submissions" && (
          <section className="space-y-3">
            <div className="flex justify-between">
              <h3 className="font-medium">成品分享審核</h3>
              <Button size="sm" variant="outline" type="button" onClick={() => loadSubmissions()}>
                重新整理
              </Button>
            </div>
            {submissions.map((s) => (
              <div key={s.id} className="space-y-2 rounded-lg border p-3">
                <p className="font-medium">{s.title || "（無標題）"}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {s.note || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.success_status} · rating {s.rating ?? "—"} ·{" "}
                  {new Date(s.created_at).toLocaleString("zh-TW")}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="input-field max-w-xs"
                    value={s.moderation_status}
                    onChange={(e) =>
                      updateSubmission(s.id, {
                        moderation_status: e.target.value as RecipeSubmissionModerationStatus,
                      })
                    }
                    disabled={saving}
                  >
                    {(["pending", "approved", "rejected", "hidden"] as const).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <Toggle
                    label="老師精選"
                    checked={s.is_teacher_pick}
                    onChange={(v) => updateSubmission(s.id, { is_teacher_pick: v })}
                  />
                </div>
              </div>
            ))}
            {!submissions.length && (
              <p className="text-sm text-muted-foreground">尚無成品分享</p>
            )}
          </section>
        )}

        {tab === "seo" && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="SEO 標題"
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              />
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">草稿</option>
                <option value="scheduled">排程</option>
                <option value="published">發布</option>
                <option value="archived">下架</option>
              </select>
            </div>
            <textarea
              className="input-field min-h-[72px]"
              placeholder="SEO 描述"
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
            />
            <Toggle
              label="精選 is_featured"
              checked={form.is_featured}
              onChange={(v) => setForm({ ...form, is_featured: v })}
            />
            <Button onClick={saveSeo} disabled={saving}>
              {saving ? "儲存中…" : "儲存 SEO 與發布"}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
