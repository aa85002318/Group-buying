"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminStoryBuilder } from "@/components/admin/recipes/AdminStoryBuilder";
import {
  DEFAULT_READER_SETTINGS,
  parseReaderSettings,
  type RecipeReaderSettings,
} from "@/lib/recipes/reader-settings";
import { parseIngredientPaste } from "@/lib/recipes/parse-ingredient-paste";
import { slugifyTitle } from "@/lib/videos/embed";
import { cn } from "@/lib/utils";
import type {
  Recipe,
  RecipeAccessPermission,
  RecipeCategory,
  RecipeIngredient,
  RecipeStep,
  RecipeTool,
} from "@/lib/types/database";

const STEPS = [
  { id: "basic", label: "基本資料" },
  { id: "materials", label: "材料與器具" },
  { id: "steps", label: "製作步驟" },
  { id: "publish", label: "預覽與發布" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const ALLERGEN_OPTIONS = ["蛋", "乳製品", "麩質", "堅果", "花生", "大豆", "芝麻", "其他"];

const ACCESS_OPTIONS: { value: RecipeAccessPermission; label: string }[] = [
  { value: "public", label: "公開" },
  { value: "member", label: "登入會員" },
  { value: "allowlist", label: "指定會員" },
  { value: "purchase", label: "購買課程" },
  { value: "code", label: "兌換碼" },
];

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type IngredientDraft = {
  clientKey: string;
  group_name: string;
  name: string;
  amount: string;
  unit: string;
  substitution_notes: string;
  product_id: string;
};

type ToolDraft = {
  clientKey: string;
  name: string;
  quantity: string;
  notes: string;
};

type StepDraft = {
  clientKey: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  duration_minutes: string;
  temperature_value: string;
  chef_notes: string;
  timer_enabled: boolean;
  ai_enabled: boolean;
  collapsed: boolean;
};

function newKey() {
  return `k_${Math.random().toString(36).slice(2, 10)}`;
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handleProps: { attributes: object; listeners: object }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-70")}
    >
      {children({ attributes, listeners: listeners ?? {} })}
    </div>
  );
}

export function AdminRecipeContentEditor({ recipeId }: { recipeId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [step, setStep] = useState<StepId>("basic");
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [persistedSteps, setPersistedSteps] = useState<RecipeStep[]>([]);
  const [recipeMedia, setRecipeMedia] = useState<Recipe["recipe_media"]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"flip" | "full">("flip");
  const [storyLayoutMode, setStoryLayoutMode] = useState<"auto" | "manual">("auto");
  const initializedRef = useRef(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    cover_image: "",
    category_id: "",
    difficulty: "easy",
    servings: "",
    prep_time: "",
    cook_time: "",
    bake_time: "",
    storage_method: "",
    tips: "",
    allergens: [] as string[],
    tags: "",
    status: "draft",
    flip_mode_enabled: true,
    full_reading_enabled: true,
    reading_mode_default: "flip" as "flip" | "full",
    ingredient_scaling_enabled: true,
    discussion_enabled: true,
    submission_enabled: true,
    ai_enabled: true,
    product_recommendation_enabled: true,
    access_permission: "public" as RecipeAccessPermission,
  });
  const [readerSettings, setReaderSettings] =
    useState<RecipeReaderSettings>(DEFAULT_READER_SETTINGS);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    {
      clientKey: newKey(),
      group_name: "材料",
      name: "",
      amount: "",
      unit: "",
      substitution_notes: "",
      product_id: "",
    },
  ]);
  const [tools, setTools] = useState<ToolDraft[]>([
    { clientKey: newKey(), name: "", quantity: "1", notes: "" },
  ]);
  const [steps, setSteps] = useState<StepDraft[]>([
    {
      clientKey: newKey(),
      title: "",
      description: "",
      image_url: "",
      video_url: "",
      duration_minutes: "",
      temperature_value: "",
      chef_notes: "",
      timer_enabled: false,
      ai_enabled: false,
      collapsed: false,
    },
  ]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const totalTime = useMemo(() => {
    const prep = Number(form.prep_time) || 0;
    const cook = Number(form.cook_time) || 0;
    const bake = Number(form.bake_time) || 0;
    const sum = prep + cook + bake;
    return sum > 0 ? sum : null;
  }, [form.prep_time, form.cook_time, form.bake_time]);

  const saveLabel = useMemo(() => {
    if (saveStatus === "saving") return "儲存中";
    if (saveStatus === "error") return "儲存失敗";
    if (saveStatus === "dirty") return "尚有未儲存內容";
    if (saveStatus === "saved") return "已自動儲存";
    return lastSavedAt ? "已儲存" : "尚未儲存";
  }, [lastSavedAt, saveStatus]);

  const loadRecipe = useCallback(async () => {
    const [recipeRes, listRes] = await Promise.all([
      fetch(`/api/admin/recipes/${recipeId}`, { cache: "no-store" }),
      fetch("/api/admin/recipes", { cache: "no-store" }),
    ]);
    const recipeJson = await recipeRes.json();
    const listJson = await listRes.json();
    if (!recipeRes.ok) throw new Error(recipeJson.error ?? "載入失敗");

    setCategories(listJson.categories ?? []);
    const r = recipeJson.recipe as Recipe;
    setStoryLayoutMode((r.story_layout_mode as "auto" | "manual") || "auto");
    setForm({
      title: r.title ?? "",
      slug: r.slug ?? "",
      summary: r.summary ?? "",
      cover_image: r.cover_image ?? "",
      category_id: r.category_id ?? "",
      difficulty: r.difficulty ?? "easy",
      servings: r.servings ?? "",
      prep_time: r.prep_time != null ? String(r.prep_time) : "",
      cook_time: r.cook_time != null ? String(r.cook_time) : "",
      bake_time: r.bake_time != null ? String(r.bake_time) : "",
      storage_method: r.storage_method ?? "",
      tips: r.tips ?? "",
      allergens: Array.isArray(r.allergens) ? r.allergens : [],
      tags: (r.tags ?? []).join(", "),
      status: r.status ?? "draft",
      flip_mode_enabled: r.flip_mode_enabled !== false,
      full_reading_enabled: r.full_reading_enabled !== false,
      reading_mode_default: r.reading_mode_default === "full" ? "full" : "flip",
      ingredient_scaling_enabled: r.ingredient_scaling_enabled !== false,
      discussion_enabled: r.discussion_enabled !== false,
      submission_enabled: r.submission_enabled !== false,
      ai_enabled: r.ai_enabled !== false,
      product_recommendation_enabled: r.product_recommendation_enabled !== false,
      access_permission: (r.access_permission as RecipeAccessPermission) ?? "public",
    });
    setReaderSettings(parseReaderSettings(r.reader_settings));

    const ings = (r.recipe_ingredients ?? []) as RecipeIngredient[];
    setIngredients(
      ings.length
        ? ings.map((ing) => ({
            clientKey: newKey(),
            group_name: ing.group_name ?? "材料",
            name: ing.name ?? "",
            amount: ing.amount ?? "",
            unit: ing.unit ?? "",
            substitution_notes: ing.substitution_notes ?? "",
            product_id: ing.product_id ?? "",
          }))
        : [
            {
              clientKey: newKey(),
              group_name: "材料",
              name: "",
              amount: "",
              unit: "",
              substitution_notes: "",
              product_id: "",
            },
          ]
    );

    const tls = (r.recipe_tools ?? []) as RecipeTool[];
    setTools(
      tls.length
        ? tls.map((t) => ({
            clientKey: newKey(),
            name: t.name ?? "",
            quantity: t.quantity != null ? String(t.quantity) : "",
            notes: t.notes ?? "",
          }))
        : [{ clientKey: newKey(), name: "", quantity: "1", notes: "" }]
    );

    const sts = (r.recipe_steps ?? []) as RecipeStep[];
    setPersistedSteps(sts);
    setRecipeMedia(r.recipe_media ?? []);
    setSteps(
      sts.length
        ? sts.map((s) => ({
            clientKey: newKey(),
            title: s.title ?? "",
            description: s.description ?? "",
            image_url: s.image_url ?? "",
            video_url: s.video_url ?? "",
            duration_minutes:
              s.duration_seconds != null ? String(Math.round(s.duration_seconds / 60)) : "",
            temperature_value: s.temperature_value != null ? String(s.temperature_value) : "",
            chef_notes: s.chef_notes ?? s.note ?? "",
            timer_enabled: Boolean(s.timer_enabled),
            ai_enabled: Boolean(s.ai_enabled),
            collapsed: true,
          }))
        : [
            {
              clientKey: newKey(),
              title: "",
              description: "",
              image_url: "",
              video_url: "",
              duration_minutes: "",
              temperature_value: "",
              chef_notes: "",
              timer_enabled: false,
              ai_enabled: false,
              collapsed: false,
            },
          ]
    );
  }, [recipeId]);

  useEffect(() => {
    setLoading(true);
    loadRecipe()
      .catch((e) => alert(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => {
        setLoading(false);
        initializedRef.current = true;
      });
  }, [loadRecipe]);

  useEffect(() => {
    if (!initializedRef.current || loading) return;
    setDirty(true);
    setSaveStatus("dirty");
  }, [form, ingredients, tools, steps, readerSettings, loading]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const payload = useCallback(() => {
    const slug = form.slug.trim() || slugifyTitle(form.title);
    return {
      title: form.title.trim(),
      slug,
      summary: form.summary.trim().slice(0, 100) || null,
      cover_image: form.cover_image || null,
      category_id: form.category_id || null,
      difficulty: form.difficulty,
      servings: form.servings || null,
      prep_time: form.prep_time ? Number(form.prep_time) : null,
      cook_time: form.cook_time ? Number(form.cook_time) : null,
      bake_time: form.bake_time ? Number(form.bake_time) : null,
      total_time: totalTime,
      storage_method: form.storage_method || null,
      tips: form.tips || null,
      allergens: form.allergens,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status,
      flip_mode_enabled: form.flip_mode_enabled,
      full_reading_enabled: form.full_reading_enabled,
      reading_mode_default: form.reading_mode_default,
      ingredient_scaling_enabled: form.ingredient_scaling_enabled,
      discussion_enabled: form.discussion_enabled,
      submission_enabled: form.submission_enabled,
      ai_enabled: form.ai_enabled,
      product_recommendation_enabled: form.product_recommendation_enabled,
      access_permission: form.access_permission,
      reader_settings: {
        ...readerSettings,
        showProducts: form.product_recommendation_enabled,
        showAskTeacher: form.ai_enabled,
        showGallery: form.submission_enabled,
      },
      is_smart_recipe: true,
      sync_story: true,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((ing, i) => ({
          group_name: ing.group_name || null,
          name: ing.name.trim(),
          amount: ing.amount || null,
          unit: ing.unit || null,
          substitution_notes: ing.substitution_notes || null,
          product_id: ing.product_id || null,
          is_required: true,
          sort_order: i,
        })),
      tools: tools
        .filter((t) => t.name.trim())
        .map((t, i) => ({
          name: t.name.trim(),
          notes: t.notes || null,
          quantity: t.quantity ? Number(t.quantity) : null,
          product_id: null,
          sort_order: i,
        })),
      steps: steps
        .filter((s) => s.description.trim() || s.title.trim())
        .map((s, i) => ({
          step_number: i + 1,
          sort_order: i,
          title: s.title || null,
          description: s.description,
          image_url: s.image_url || null,
          video_url: s.video_url || null,
          chef_notes: s.chef_notes || null,
          note: s.chef_notes || null,
          duration_seconds: s.duration_minutes
            ? Math.round(Number(s.duration_minutes) * 60)
            : null,
          temperature_value: s.temperature_value ? Number(s.temperature_value) : null,
          temperature_unit: "C",
          timer_enabled: s.timer_enabled,
          ai_enabled: s.ai_enabled,
          ai_context: s.chef_notes || null,
        })),
    };
  }, [form, ingredients, readerSettings, steps, tools, totalTime]);

  const save = useCallback(
    async (extra: Record<string, unknown> = {}, options: { silent?: boolean; forceStory?: boolean } = {}) => {
      if (!form.title.trim()) {
        if (!options.silent) alert("請填寫食譜名稱");
        return false;
      }
      setSaving(true);
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/admin/recipes/${recipeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload(),
            ...extra,
            force_story_sync: options.forceStory === true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "儲存失敗");

        if (data.storySync?.needsConfirm) {
          const ok = confirm(
            "此食譜含有手動設定的翻頁內容。重新產生可能覆蓋頁面順序，是否繼續？"
          );
          if (ok) {
            await fetch(`/api/admin/recipes/${recipeId}/sync-story`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ force: true }),
            });
            setStoryLayoutMode("auto");
          }
        } else if (data.storySync?.mode === "auto") {
          setStoryLayoutMode("auto");
        }

        setDirty(false);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        if (!options.silent) {
          initializedRef.current = false;
          await loadRecipe();
          initializedRef.current = true;
        }
        return true;
      } catch (e) {
        setSaveStatus("error");
        if (!options.silent) alert(e instanceof Error ? e.message : "儲存失敗");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [form.title, loadRecipe, payload, recipeId]
  );

  const saveRef = useRef(save);
  saveRef.current = save;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const savingRef = useRef(saving);
  savingRef.current = saving;

  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current && !savingRef.current) void saveRef.current({}, { silent: true });
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const onIngredientDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setIngredients((items) => {
      const oldIndex = items.findIndex((i) => i.clientKey === active.id);
      const newIndex = items.findIndex((i) => i.clientKey === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const onStepDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((items) => {
      const oldIndex = items.findIndex((i) => i.clientKey === active.id);
      const newIndex = items.findIndex((i) => i.clientKey === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const applyPaste = () => {
    const parsed = parseIngredientPaste(pasteText);
    if (!parsed.length) {
      alert("沒有可解析的材料列");
      return;
    }
    setIngredients((prev) => [
      ...prev.filter((p) => p.name.trim()),
      ...parsed.map((row) => ({
        clientKey: newKey(),
        group_name: "材料",
        name: row.name,
        amount: row.amount,
        unit: row.unit,
        substitution_notes: "",
        product_id: "",
      })),
    ]);
    setPasteText("");
    setPasteOpen(false);
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-[#5E6B84]">載入食譜中…</p>;
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-16 text-[#153E73]">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E8E1D7] bg-white px-5 py-4">
        <div>
          <p className="text-xs font-semibold text-[#8A94A6]">編輯食譜</p>
          <h1 className="mt-1 text-xl font-bold">{form.title || "未命名食譜"}</h1>
          <p className="mt-1 text-xs text-[#5E6B84]">
            {saveLabel}
            {lastSavedAt ? ` · ${lastSavedAt.toLocaleTimeString("zh-TW")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/recipes/${form.slug || recipeId}?view=flip`}
            target="_blank"
            className="inline-flex h-11 items-center justify-center rounded-button border border-border px-5 text-sm font-bold text-[#153E73]"
          >
            預覽
          </Link>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => void save({ status: "draft" })}
          >
            儲存草稿
          </Button>
          <Button
            className="bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
            disabled={saving}
            onClick={() => void save({ status: "published" })}
          >
            發布食譜
          </Button>
        </div>
      </header>

      <nav className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {STEPS.map((item, index) => {
          const active = item.id === step;
          const done = index < stepIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left text-sm font-semibold transition",
                active && "border-[#FFE149] bg-[#FFF5CC] text-[#153E73]",
                !active && done && "border-[#153E73]/20 bg-white text-[#153E73]",
                !active && !done && "border-[#E8E1D7] bg-[#FFFEFA] text-[#5E6B84]"
              )}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs">
                {index + 1}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <section className="rounded-2xl border border-[#E8E1D7] bg-white p-5 shadow-[0_8px_24px_rgba(21,62,115,0.04)]">
        {step === "basic" ? (
          <div className="space-y-4">
            <Field label="食譜名稱 *">
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: f.slug && f.slug !== slugifyTitle(f.title) ? f.slug : slugifyTitle(title),
                  }));
                }}
              />
            </Field>
            <Field label="食譜分類">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">選擇分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="封面圖片">
              <p className="mb-2 text-xs text-[#8A94A6]">
                建議尺寸 1200×900px、比例 4:3、JPG／PNG／WebP、建議小於 2MB
              </p>
              <AdminImageUpload
                images={form.cover_image ? [form.cover_image] : []}
                onChange={(imgs) => setForm({ ...form, cover_image: imgs[0] ?? "" })}
                multiple={false}
                maxImages={1}
                uploadFolder={`recipes/${recipeId}`}
                bucket="recipe-media"
              />
            </Field>
            <Field label="食譜簡介（100字以內）">
              <textarea
                className="min-h-[88px] w-full rounded-md border border-input px-3 py-2 text-sm"
                maxLength={100}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
              <p className="mt-1 text-right text-xs text-[#8A94A6]">{form.summary.length}/100</p>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="難易度">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  <option value="easy">初學</option>
                  <option value="medium">進階</option>
                  <option value="hard">挑戰</option>
                </select>
              </Field>
              <Field label="成品份量">
                <Input
                  placeholder="例如 12 片"
                  value={form.servings}
                  onChange={(e) => setForm({ ...form, servings: e.target.value })}
                />
              </Field>
              <Field label="準備時間（分）">
                <Input
                  type="number"
                  value={form.prep_time}
                  onChange={(e) => setForm({ ...form, prep_time: e.target.value })}
                />
              </Field>
              <Field label="製作時間（分）">
                <Input
                  type="number"
                  value={form.cook_time}
                  onChange={(e) => setForm({ ...form, cook_time: e.target.value })}
                />
              </Field>
              <Field label="烘烤時間（分）">
                <Input
                  type="number"
                  value={form.bake_time}
                  onChange={(e) => setForm({ ...form, bake_time: e.target.value })}
                />
              </Field>
              <Field label="總時間（自動）">
                <Input value={totalTime != null ? `${totalTime} 分` : "—"} disabled />
              </Field>
            </div>
            <Field label="保存方式">
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm"
                value={form.storage_method}
                onChange={(e) => setForm({ ...form, storage_method: e.target.value })}
              />
            </Field>
            <Field label="製作重點">
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm"
                value={form.tips}
                onChange={(e) => setForm({ ...form, tips: e.target.value })}
              />
            </Field>
            <Field label="過敏原">
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((item) => {
                  const on = form.allergens.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          allergens: on
                            ? f.allergens.filter((a) => a !== item)
                            : [...f.allergens, item],
                        }))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold",
                        on
                          ? "border-[#FFE149] bg-[#FFF5CC] text-[#153E73]"
                          : "border-[#E8E1D7] bg-white text-[#5E6B84]"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="標籤（逗號分隔，選填）">
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="例如 餅乾, 巧克力"
              />
            </Field>
          </div>
        ) : null}

        {step === "materials" ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">材料</h2>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPasteOpen((v) => !v)}>
                  批次貼上
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
                  onClick={() =>
                    setIngredients((prev) => [
                      ...prev,
                      {
                        clientKey: newKey(),
                        group_name: "材料",
                        name: "",
                        amount: "",
                        unit: "",
                        substitution_notes: "",
                        product_id: "",
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  新增材料
                </Button>
              </div>
            </div>

            {pasteOpen ? (
              <div className="rounded-xl border border-dashed border-[#D8A66A] bg-[#FFFEFA] p-3">
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 font-mono text-sm"
                  placeholder={"無鹽奶油 100g\n細砂糖 60g\n低筋麵粉 180g"}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" onClick={applyPaste}>
                    解析並加入
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPasteOpen(false)}>
                    取消
                  </Button>
                </div>
              </div>
            ) : null}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onIngredientDragEnd}>
              <SortableContext items={ingredients.map((i) => i.clientKey)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <SortableRow key={ing.clientKey} id={ing.clientKey}>
                      {({ attributes, listeners }) => (
                        <div className="grid grid-cols-[28px_1fr_72px_64px_1fr_1fr_36px] items-center gap-2 rounded-xl border border-[#E8E1D7] bg-[#FFFEFA] p-2">
                          <button type="button" className="text-[#8A94A6]" {...attributes} {...listeners}>
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <Input
                            placeholder="材料名稱"
                            value={ing.name}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx] = { ...ing, name: e.target.value };
                              setIngredients(next);
                            }}
                          />
                          <Input
                            placeholder="數量"
                            value={ing.amount}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx] = { ...ing, amount: e.target.value };
                              setIngredients(next);
                            }}
                          />
                          <Input
                            placeholder="單位"
                            value={ing.unit}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx] = { ...ing, unit: e.target.value };
                              setIngredients(next);
                            }}
                          />
                          <Input
                            placeholder="備註"
                            value={ing.substitution_notes}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx] = { ...ing, substitution_notes: e.target.value };
                              setIngredients(next);
                            }}
                          />
                          <Input
                            placeholder="商品 ID（選填）"
                            value={ing.product_id}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx] = { ...ing, product_id: e.target.value };
                              setIngredients(next);
                            }}
                          />
                          <button
                            type="button"
                            className="text-[#F16458]"
                            onClick={() =>
                              setIngredients((prev) => prev.filter((x) => x.clientKey !== ing.clientKey))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </SortableRow>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <h2 className="text-base font-bold">器具</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setTools((prev) => [
                    ...prev,
                    { clientKey: newKey(), name: "", quantity: "1", notes: "" },
                  ])
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                新增器具
              </Button>
            </div>
            <div className="space-y-2">
              {tools.map((tool, idx) => (
                <div
                  key={tool.clientKey}
                  className="grid grid-cols-[1fr_72px_1fr_36px] items-center gap-2 rounded-xl border border-[#E8E1D7] bg-[#FFFEFA] p-2"
                >
                  <Input
                    placeholder="器具名稱"
                    value={tool.name}
                    onChange={(e) => {
                      const next = [...tools];
                      next[idx] = { ...tool, name: e.target.value };
                      setTools(next);
                    }}
                  />
                  <Input
                    placeholder="數量"
                    value={tool.quantity}
                    onChange={(e) => {
                      const next = [...tools];
                      next[idx] = { ...tool, quantity: e.target.value };
                      setTools(next);
                    }}
                  />
                  <Input
                    placeholder="備註"
                    value={tool.notes}
                    onChange={(e) => {
                      const next = [...tools];
                      next[idx] = { ...tool, notes: e.target.value };
                      setTools(next);
                    }}
                  />
                  <button
                    type="button"
                    className="text-[#F16458]"
                    onClick={() => setTools((prev) => prev.filter((x) => x.clientKey !== tool.clientKey))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === "steps" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">製作步驟</h2>
              <Button
                type="button"
                size="sm"
                className="bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
                onClick={() =>
                  setSteps((prev) => [
                    ...prev,
                    {
                      clientKey: newKey(),
                      title: "",
                      description: "",
                      image_url: "",
                      video_url: "",
                      duration_minutes: "",
                      temperature_value: "",
                      chef_notes: "",
                      timer_enabled: false,
                      ai_enabled: false,
                      collapsed: false,
                    },
                  ])
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                新增製作步驟
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onStepDragEnd}>
              <SortableContext items={steps.map((s) => s.clientKey)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {steps.map((s, idx) => (
                    <SortableRow key={s.clientKey} id={s.clientKey}>
                      {({ attributes, listeners }) => (
                        <div className="rounded-2xl border border-[#E8E1D7] bg-[#FFFEFA]">
                          <div className="flex items-center gap-2 border-b border-[#E8E1D7] px-3 py-2">
                            <button type="button" className="text-[#8A94A6]" {...attributes} {...listeners}>
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="flex flex-1 items-center gap-2 text-left text-sm font-bold"
                              onClick={() => {
                                const next = [...steps];
                                next[idx] = { ...s, collapsed: !s.collapsed };
                                setSteps(next);
                              }}
                            >
                              <span className="text-[#8A94A6]">步驟 {idx + 1}</span>
                              <span>{s.title || "未命名步驟"}</span>
                              <ChevronDown
                                className={cn("ml-auto h-4 w-4 transition", !s.collapsed && "rotate-180")}
                              />
                            </button>
                            <button
                              type="button"
                              className="text-xs text-[#153E73]"
                              onClick={() =>
                                setSteps((prev) => [
                                  ...prev.slice(0, idx + 1),
                                  { ...s, clientKey: newKey(), collapsed: false },
                                  ...prev.slice(idx + 1),
                                ])
                              }
                            >
                              複製
                            </button>
                            <button
                              type="button"
                              className="text-[#F16458]"
                              onClick={() =>
                                setSteps((prev) => prev.filter((x) => x.clientKey !== s.clientKey))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {!s.collapsed ? (
                            <div className="space-y-3 p-4">
                              <Input
                                placeholder="步驟標題"
                                value={s.title}
                                onChange={(e) => {
                                  const next = [...steps];
                                  next[idx] = { ...s, title: e.target.value };
                                  setSteps(next);
                                }}
                              />
                              <textarea
                                className="min-h-[96px] w-full rounded-md border border-input px-3 py-2 text-sm"
                                placeholder="步驟說明"
                                value={s.description}
                                onChange={(e) => {
                                  const next = [...steps];
                                  next[idx] = { ...s, description: e.target.value };
                                  setSteps(next);
                                }}
                              />
                              <div className="grid gap-3 md:grid-cols-2">
                                <Field label="步驟圖片">
                                  <AdminImageUpload
                                    images={s.image_url ? [s.image_url] : []}
                                    onChange={(imgs) => {
                                      const next = [...steps];
                                      next[idx] = { ...s, image_url: imgs[0] ?? "" };
                                      setSteps(next);
                                    }}
                                    multiple={false}
                                    maxImages={1}
                                    uploadFolder={`recipes/${recipeId}/steps`}
                                    bucket="recipe-media"
                                  />
                                </Field>
                                <Field label="影片 URL（選填）">
                                  <Input
                                    value={s.video_url}
                                    onChange={(e) => {
                                      const next = [...steps];
                                      next[idx] = { ...s, video_url: e.target.value };
                                      setSteps(next);
                                    }}
                                    placeholder="https://..."
                                  />
                                </Field>
                                <Field label="時間（分）">
                                  <Input
                                    type="number"
                                    value={s.duration_minutes}
                                    onChange={(e) => {
                                      const next = [...steps];
                                      next[idx] = { ...s, duration_minutes: e.target.value };
                                      setSteps(next);
                                    }}
                                  />
                                </Field>
                                <Field label="溫度 °C">
                                  <Input
                                    type="number"
                                    value={s.temperature_value}
                                    onChange={(e) => {
                                      const next = [...steps];
                                      next[idx] = { ...s, temperature_value: e.target.value };
                                      setSteps(next);
                                    }}
                                  />
                                </Field>
                              </div>
                              <Field label="老師提醒">
                                <textarea
                                  className="min-h-[72px] w-full rounded-md border border-input px-3 py-2 text-sm"
                                  value={s.chef_notes}
                                  onChange={(e) => {
                                    const next = [...steps];
                                    next[idx] = { ...s, chef_notes: e.target.value };
                                    setSteps(next);
                                  }}
                                />
                              </Field>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={s.timer_enabled}
                                    onChange={(e) => {
                                      const next = [...steps];
                                      next[idx] = { ...s, timer_enabled: e.target.checked };
                                      setSteps(next);
                                    }}
                                  />
                                  開啟倒數計時器
                                </label>
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={s.ai_enabled}
                                    onChange={(e) => {
                                      const next = [...steps];
                                      next[idx] = { ...s, ai_enabled: e.target.checked };
                                      setSteps(next);
                                    }}
                                  />
                                  開放 AI 提問
                                </label>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </SortableRow>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : null}

        {step === "publish" ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              {(["flip", "full"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold",
                    previewMode === mode
                      ? "bg-[#FFE149] text-[#153E73]"
                      : "border border-[#E8E1D7] bg-white text-[#5E6B84]"
                  )}
                >
                  {mode === "flip" ? "翻頁閱讀" : "完整閱讀"}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-[28px] border border-[#E8E1D7] bg-[#FFF5CC] p-4">
              <div className="mx-auto w-full max-w-[360px] rounded-[24px] border border-[#153E73]/10 bg-white p-4 shadow-sm">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#FFF5CC]">
                  {form.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.cover_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#8A94A6]">
                      封面預覽
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-bold">{form.title || "未命名食譜"}</h3>
                <p className="mt-1 text-sm leading-6 text-[#5E6B84]">
                  {form.summary || "儲存後可開啟前台預覽完整翻頁／完整閱讀。"}
                </p>
                <p className="mt-3 text-xs text-[#8A94A6]">
                  模式：{previewMode === "flip" ? "翻頁閱讀" : "完整閱讀"} · 材料{" "}
                  {ingredients.filter((i) => i.name.trim()).length} · 步驟{" "}
                  {steps.filter((s) => s.description.trim() || s.title.trim()).length}
                </p>
                <Link
                  href={`/recipes/${form.slug || recipeId}?view=${previewMode}`}
                  target="_blank"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-button bg-[#FFE149] text-sm font-bold text-[#153E73]"
                >
                  開啟前台預覽
                </Link>
              </div>
            </div>

            <ToggleGroup
              title="閱讀設定"
              items={[
                {
                  key: "flip",
                  label: "開放翻頁閱讀",
                  checked: form.flip_mode_enabled,
                  onChange: (v) => setForm({ ...form, flip_mode_enabled: v }),
                },
                {
                  key: "full",
                  label: "開放完整閱讀",
                  checked: form.full_reading_enabled,
                  onChange: (v) => setForm({ ...form, full_reading_enabled: v }),
                },
              ]}
            />
            <Field label="預設閱讀模式">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.reading_mode_default}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reading_mode_default: e.target.value === "full" ? "full" : "flip",
                  })
                }
              >
                <option value="flip">翻頁閱讀</option>
                <option value="full">完整閱讀</option>
              </select>
            </Field>

            <ToggleGroup
              title="互動設定"
              items={[
                {
                  key: "scale",
                  label: "配方倍率",
                  checked: form.ingredient_scaling_enabled,
                  onChange: (v) => setForm({ ...form, ingredient_scaling_enabled: v }),
                },
                {
                  key: "check",
                  label: "材料勾選",
                  checked: readerSettings.showToc,
                  onChange: (v) => setReaderSettings({ ...readerSettings, showToc: v }),
                },
                {
                  key: "timer",
                  label: "計時器",
                  checked: readerSettings.showCautionPopup,
                  onChange: (v) => setReaderSettings({ ...readerSettings, showCautionPopup: v }),
                },
                {
                  key: "ai",
                  label: "AI 小幫手",
                  checked: form.ai_enabled,
                  onChange: (v) => setForm({ ...form, ai_enabled: v }),
                },
                {
                  key: "discuss",
                  label: "問題討論",
                  checked: form.discussion_enabled,
                  onChange: (v) => setForm({ ...form, discussion_enabled: v }),
                },
                {
                  key: "share",
                  label: "作品分享",
                  checked: form.submission_enabled,
                  onChange: (v) => setForm({ ...form, submission_enabled: v }),
                },
                {
                  key: "rec",
                  label: "商品推薦",
                  checked: form.product_recommendation_enabled,
                  onChange: (v) => setForm({ ...form, product_recommendation_enabled: v }),
                },
              ]}
            />

            <Field label="觀看權限">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.access_permission}
                onChange={(e) =>
                  setForm({
                    ...form,
                    access_permission: e.target.value as RecipeAccessPermission,
                  })
                }
              >
                {ACCESS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex flex-wrap gap-2 border-t border-[#E8E1D7] pt-4">
              <Button variant="outline" disabled={saving} onClick={() => void save({ status: "draft" })}>
                儲存草稿
              </Button>
              <Link
                href={`/recipes/${form.slug || recipeId}?view=flip`}
                target="_blank"
                className="inline-flex h-11 items-center justify-center rounded-button border border-border px-5 text-sm font-bold text-[#153E73]"
              >
                預覽
              </Link>
              <Button
                className="bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
                disabled={saving}
                onClick={() => void save({ status: "published" })}
              >
                發布食譜
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)].id)}
        >
          上一步
        </Button>
        {stepIndex < STEPS.length - 1 ? (
          <Button
            type="button"
            className="bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
            disabled={saving}
            onClick={async () => {
              const ok = await save({}, { silent: true });
              if (ok) setStep(STEPS[stepIndex + 1].id);
            }}
          >
            儲存並繼續
          </Button>
        ) : (
          <Button
            type="button"
            className="bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
            disabled={saving}
            onClick={() => void save({ status: "published" })}
          >
            發布食譜
          </Button>
        )}
      </div>

      <details
        className="rounded-2xl border border-[#E8E1D7] bg-white"
        open={advancedOpen}
        onToggle={(e) => {
          const open = (e.target as HTMLDetailsElement).open;
          setAdvancedOpen(open);
          if (open) {
            void fetch(`/api/admin/recipes/${recipeId}/sync-story`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ markManual: true }),
            }).then(() => setStoryLayoutMode("manual"));
          }
        }}
      >
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-[#153E73]">
          進階翻頁設定
          <span className="ml-2 text-xs font-normal text-[#8A94A6]">
            {storyLayoutMode === "manual" ? "（手動模式）" : "（預設隱藏）"}
          </span>
        </summary>
        <div className="border-t border-[#E8E1D7] px-3 pb-4 pt-2">
          <p className="mb-3 px-2 text-xs leading-6 text-[#5E6B84]">
            一般食譜請使用上方四步驟自動產生翻頁。僅在需要章節樹、比較頁、檢查頁或版型微調時才開啟此區。
          </p>
          {advancedOpen ? (
            <AdminStoryBuilder
              recipeId={recipeId}
              recipeMedia={(recipeMedia ?? [])
                .filter((m) => Boolean(m.url))
                .map((m) => ({
                  id: m.id,
                  media_type: m.media_type,
                  url: m.url as string,
                  thumbnail_url: m.thumbnail_url ?? undefined,
                  alt_text: m.alt_text ?? undefined,
                }))}
              steps={persistedSteps}
              recipeTitle={form.title}
              coverImage={form.cover_image || null}
            />
          ) : null}
        </div>
      </details>

      <p className="text-center text-xs text-[#8A94A6]">
        <Link href="/admin/recipes" className="underline">
          返回食譜列表
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[#153E73]">{label}</span>
      {children}
    </label>
  );
}

function ToggleGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; checked: boolean; onChange: (v: boolean) => void }>;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <label
            key={item.key}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E1D7] bg-[#FFFEFA] px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => item.onChange(e.target.checked)}
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}
