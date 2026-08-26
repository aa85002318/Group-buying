"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ChevronDown, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIFFICULTY_LABELS, type RecipeContentType } from "@/lib/recipes/recipe-type";
import { cn } from "@/lib/utils";
import { slugifyTitle } from "@/lib/videos/embed";
import type {
  ContentPublishStatus,
  Recipe,
  RecipeCategory,
  RecipeDifficulty,
} from "@/lib/types/database";

type IngredientDraft = {
  clientKey: string;
  name: string;
  amount: string;
  unit: string;
  substitution_notes: string;
};

type StepDraft = {
  clientKey: string;
  title: string;
  description: string;
  image_url: string;
};

type FormState = {
  recipe_type: RecipeContentType;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: string;
  cover_image: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  servings: string;
  difficulty: RecipeDifficulty;
  youtube_url: string;
  video_url: string;
  video_source: "youtube" | "upload";
  tips: string;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  status: ContentPublishStatus;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
};

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function newKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyForm(type: RecipeContentType = "article"): FormState {
  return {
    recipe_type: type,
    title: "",
    slug: "",
    summary: "",
    content: "",
    category_id: "",
    cover_image: "",
    prep_time: "",
    cook_time: "",
    total_time: "",
    servings: "",
    difficulty: "easy",
    youtube_url: "",
    video_url: "",
    video_source: "youtube",
    tips: "",
    seo_title: "",
    seo_description: "",
    seo_image: "",
    status: "draft",
    ingredients: [],
    steps: [],
  };
}

function recipeToForm(recipe: Recipe): FormState {
  const hasYt = Boolean(recipe.youtube_url?.trim());
  return {
    recipe_type: recipe.recipe_type === "video" ? "video" : "article",
    title: recipe.title ?? "",
    slug: recipe.slug ?? "",
    summary: recipe.summary ?? "",
    content: recipe.content ?? "",
    category_id: recipe.category_id ?? "",
    cover_image: recipe.cover_image ?? "",
    prep_time: recipe.prep_time != null ? String(recipe.prep_time) : "",
    cook_time: recipe.cook_time != null ? String(recipe.cook_time) : "",
    total_time: recipe.total_time != null ? String(recipe.total_time) : "",
    servings: recipe.servings ?? "",
    difficulty: recipe.difficulty ?? "easy",
    youtube_url: recipe.youtube_url ?? "",
    video_url: recipe.video_url ?? "",
    video_source: hasYt || !recipe.video_url ? "youtube" : "upload",
    tips: recipe.tips ?? "",
    seo_title: recipe.seo_title ?? "",
    seo_description: recipe.seo_description ?? "",
    seo_image: recipe.seo_image ?? "",
    status: recipe.status ?? "draft",
    ingredients: (recipe.recipe_ingredients ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ing) => ({
        clientKey: ing.id,
        name: ing.name ?? "",
        amount: ing.amount ?? "",
        unit: ing.unit ?? "",
        substitution_notes: ing.substitution_notes ?? "",
      })),
    steps: (recipe.recipe_steps ?? [])
      .slice()
      .sort((a, b) => (a.step_number || a.sort_order) - (b.step_number || b.sort_order))
      .map((step) => ({
        clientKey: step.id,
        title: step.title ?? "",
        description: step.description ?? "",
        image_url: step.image_url ?? "",
      })),
  };
}

function formToPayload(form: FormState) {
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
  return {
    recipe_type: form.recipe_type,
    title: form.title.trim(),
    slug: form.slug.trim() || slugifyTitle(form.title),
    summary: form.summary.trim() || null,
    content: form.content.trim() || null,
    category_id: form.category_id || null,
    cover_image: form.cover_image || null,
    prep_time: numOrNull(form.prep_time),
    cook_time: numOrNull(form.cook_time),
    total_time: numOrNull(form.total_time),
    servings: form.servings.trim() || null,
    difficulty: form.difficulty,
    youtube_url:
      form.recipe_type === "video" && form.video_source === "youtube"
        ? form.youtube_url.trim() || null
        : form.youtube_url.trim() || null,
    video_url:
      form.recipe_type === "video" && form.video_source === "upload"
        ? form.video_url.trim() || null
        : form.video_url.trim() || null,
    tips: form.tips.trim() || null,
    seo_title: form.seo_title.trim() || null,
    seo_description: form.seo_description.trim() || null,
    seo_image: form.seo_image.trim() || null,
    status: form.status,
    published_at: form.status === "published" ? new Date().toISOString() : null,
    is_smart_recipe: false,
    flip_mode_enabled: false,
    full_reading_enabled: true,
    reading_mode_default: "full" as const,
    ingredients: form.ingredients
      .filter((ing) => ing.name.trim())
      .map((ing, i) => ({
        name: ing.name.trim(),
        amount: ing.amount.trim() || null,
        unit: ing.unit.trim() || null,
        substitution_notes: ing.substitution_notes.trim() || null,
        sort_order: i,
      })),
    steps:
      form.recipe_type === "article"
        ? form.steps
            .filter((s) => s.description.trim() || s.image_url)
            .map((s, i) => ({
              step_number: i + 1,
              title: s.title.trim() || null,
              description: s.description.trim(),
              image_url: s.image_url || null,
              sort_order: i,
            }))
        : [],
  };
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handleProps: { attributes: object; listeners: object }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners: listeners ?? {} })}
    </div>
  );
}

function SectionCard({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-[#E8E1D7] bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold text-[#153E73]"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 text-[#8A94A6] transition", open && "rotate-180")} />
      </button>
      {open ? <div className="space-y-4 border-t border-[#E8E1D7] px-4 py-4">{children}</div> : null}
    </section>
  );
}

export function RecipeEditor({
  mode,
  recipeId,
}: {
  mode: "create" | "edit";
  recipeId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => emptyForm("article"));
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [typePicked, setTypePicked] = useState(mode === "edit");
  const baseline = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentId = useRef<string | undefined>(recipeId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const patch = useCallback((partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setSaveStatus("dirty");
  }, []);

  useEffect(() => {
    fetch("/api/admin/recipes")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !recipeId) return;
    setLoading(true);
    fetch(`/api/admin/recipes/${recipeId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        const next = recipeToForm(d.recipe as Recipe);
        setForm(next);
        baseline.current = JSON.stringify(next);
        setTypePicked(true);
        setSaveStatus("idle");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [mode, recipeId]);

  const persist = useCallback(
    async (next: FormState, opts?: { navigateOnCreate?: boolean; publish?: boolean }) => {
      const payload = formToPayload(next);
      if (!payload.title) {
        setError("請填寫食譜名稱");
        return null;
      }
      const publishing = opts?.publish || next.status === "published";
      if (publishing && !payload.cover_image) {
        setError("上架前請上傳封面圖片");
        return null;
      }
      if (!publishing) {
        payload.status = "draft";
        payload.published_at = null;
      }
      setSaveStatus("saving");
      setError(null);
      try {
        if (!currentId.current) {
          const res = await fetch("/api/admin/recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "儲存失敗");
          currentId.current = data.recipe.id as string;
          baseline.current = JSON.stringify(next);
          setSaveStatus("saved");
          if (opts?.navigateOnCreate !== false) {
            router.replace(`/admin/recipes/${data.recipe.id}`);
          }
          return data.recipe.id as string;
        }
        const res = await fetch(`/api/admin/recipes/${currentId.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "儲存失敗");
        baseline.current = JSON.stringify(next);
        setSaveStatus("saved");
        return currentId.current;
      } catch (e) {
        setSaveStatus("error");
        setError(e instanceof Error ? e.message : "儲存失敗");
        return null;
      }
    },
    [router]
  );

  useEffect(() => {
    if (!typePicked || loading) return;
    const snap = JSON.stringify(form);
    if (snap === baseline.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist(form, { navigateOnCreate: Boolean(currentId.current) });
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, typePicked, loading, persist]);

  const onIngredientDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = form.ingredients.findIndex((i) => i.clientKey === active.id);
    const newIndex = form.ingredients.findIndex((i) => i.clientKey === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    patch({ ingredients: arrayMove(form.ingredients, oldIndex, newIndex) });
  };

  const onStepDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = form.steps.findIndex((i) => i.clientKey === active.id);
    const newIndex = form.steps.findIndex((i) => i.clientKey === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    patch({ steps: arrayMove(form.steps, oldIndex, newIndex) });
  };

  const preview = async () => {
    const id = await persist(form);
    const slug = form.slug.trim() || slugifyTitle(form.title);
    if (!id) return;
    if (form.status !== "published") {
      setError("草稿需先發布才能在前台預覽；已儲存目前內容。");
      return;
    }
    window.open(`/recipes/${slug}`, "_blank");
  };

  const saveLabel = useMemo(() => {
    if (saveStatus === "saving") return "正在儲存...";
    if (saveStatus === "saved") return "● 已儲存";
    if (saveStatus === "dirty") return "尚有未儲存變更";
    if (saveStatus === "error") return "儲存失敗";
    return "";
  }, [saveStatus]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-white" />
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!typePicked) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-xl font-semibold text-[#153E73]">新增食譜</h1>
        <p className="text-sm text-[#8A94A6]">請先選擇食譜類型，系統會套用對應模板。</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["video", "影片食譜", "以影片為核心，材料與小提醒"],
              ["article", "圖文食譜", "材料 + STEP 圖片說明一路下滑"],
            ] as const
          ).map(([value, label, desc]) => (
            <button
              key={value}
              type="button"
              className="rounded-xl border border-[#E8E1D7] bg-white p-5 text-left shadow-sm hover:border-[#153E73]"
              onClick={() => {
                setForm(emptyForm(value));
                setTypePicked(true);
                setSaveStatus("dirty");
              }}
            >
              <p className="text-base font-semibold text-[#153E73]">{label}</p>
              <p className="mt-1 text-sm text-[#8A94A6]">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 min-h-full bg-[#F7F8FA] px-4 py-6 md:-mx-6 md:px-6">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#8A94A6]">
              <Link href="/admin/recipes" className="hover:underline">
                食譜管理
              </Link>
              <span className="mx-1">＞</span>
              {mode === "create" ? "新增食譜" : "編輯食譜"}
            </p>
            <h1 className="text-xl font-semibold text-[#153E73]">
              {mode === "create" ? "新增食譜" : "編輯食譜"}
            </h1>
            {saveLabel ? <p className="text-xs text-[#8A94A6]">{saveLabel}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void persist(form)}>
              儲存草稿
            </Button>
            <Button type="button" variant="outline" onClick={() => void preview()}>
              預覽
            </Button>
            <Button
              type="button"
              className="bg-[#153E73] text-white hover:bg-[#0F2E56]"
              onClick={() => {
                const next = { ...form, status: "published" as const };
                setForm(next);
                void persist(next, { publish: true });
              }}
            >
              發布
            </Button>
          </div>
        </header>

        {error ? <p className="mb-3 text-sm text-[#F16458]">{error}</p> : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <SectionCard title="食譜類型">
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["video", "影片食譜"],
                    ["article", "圖文食譜"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={cn(
                      "cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium",
                      form.recipe_type === value
                        ? "border-[#153E73] bg-[#153E73] text-white"
                        : "border-[#E8E1D7] bg-white text-[#153E73]"
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={form.recipe_type === value}
                      onChange={() => patch({ recipe_type: value })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="基本資料">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">食譜名稱 *</span>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    patch({
                      title,
                      slug: form.slug && form.slug !== slugifyTitle(form.title) ? form.slug : slugifyTitle(title),
                    });
                  }}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">副標題</span>
                <Input value={form.summary} onChange={(e) => patch({ summary: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">食譜簡介</span>
                <textarea
                  className="min-h-[96px] w-full rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                  value={form.content}
                  onChange={(e) => patch({ content: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">食譜分類</span>
                <select
                  className="h-11 w-full rounded-xl border border-[#E8E1D7] px-3 text-sm"
                  value={form.category_id}
                  onChange={(e) => patch({ category_id: e.target.value })}
                >
                  <option value="">選擇分類</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <p className="mb-2 text-sm font-medium">封面圖片 *</p>
                <AdminImageUpload
                  images={form.cover_image ? [form.cover_image] : []}
                  onChange={(imgs) => patch({ cover_image: imgs[0] ?? "" })}
                  multiple={false}
                  maxImages={1}
                  aspectRatio="video"
                  label="封面"
                  uploadFolder="recipes"
                  bucket="product-images"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">製作時間（分）</span>
                  <Input
                    type="number"
                    min={0}
                    value={form.total_time || form.prep_time}
                    onChange={(e) => patch({ total_time: e.target.value, prep_time: e.target.value })}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">份量</span>
                  <Input value={form.servings} onChange={(e) => patch({ servings: e.target.value })} placeholder="例如 6 人份" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">難易度</span>
                  <select
                    className="h-11 w-full rounded-xl border border-[#E8E1D7] px-3 text-sm"
                    value={form.difficulty}
                    onChange={(e) => patch({ difficulty: e.target.value as RecipeDifficulty })}
                  >
                    {(Object.keys(DIFFICULTY_LABELS) as RecipeDifficulty[]).map((key) => (
                      <option key={key} value={key}>
                        {DIFFICULTY_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </SectionCard>

            {form.recipe_type === "video" ? (
              <SectionCard title="影片">
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ["youtube", "YouTube"],
                      ["upload", "上傳影片"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        "cursor-pointer rounded-xl border px-4 py-2 text-sm",
                        form.video_source === value
                          ? "border-[#153E73] bg-[#153E73] text-white"
                          : "border-[#E8E1D7] bg-white"
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={form.video_source === value}
                        onChange={() => patch({ video_source: value })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {form.video_source === "youtube" ? (
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">YouTube URL</span>
                    <Input
                      value={form.youtube_url}
                      onChange={(e) => patch({ youtube_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </label>
                ) : (
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">影片網址（上傳後貼上）</span>
                    <Input
                      value={form.video_url}
                      onChange={(e) => patch({ video_url: e.target.value })}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-[#8A94A6]">
                      請使用既有 `/api/admin/upload` 上傳至 Storage 後貼上 URL（沿用現有上傳流程）。
                    </p>
                  </label>
                )}
              </SectionCard>
            ) : null}

            <SectionCard title="材料">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onIngredientDragEnd}>
                <SortableContext items={form.ingredients.map((i) => i.clientKey)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {form.ingredients.map((ing, index) => (
                      <SortableRow key={ing.clientKey} id={ing.clientKey}>
                        {({ attributes, listeners }) => (
                          <div className="grid gap-2 rounded-xl border border-[#E8E1D7] p-3 md:grid-cols-[auto_1fr_90px_90px_1fr_auto]">
                            <button type="button" className="text-[#8A94A6]" {...attributes} {...listeners}>
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <Input
                              placeholder="材料名稱"
                              value={ing.name}
                              onChange={(e) => {
                                const ingredients = [...form.ingredients];
                                ingredients[index] = { ...ing, name: e.target.value };
                                patch({ ingredients });
                              }}
                            />
                            <Input
                              placeholder="數量"
                              value={ing.amount}
                              onChange={(e) => {
                                const ingredients = [...form.ingredients];
                                ingredients[index] = { ...ing, amount: e.target.value };
                                patch({ ingredients });
                              }}
                            />
                            <Input
                              placeholder="單位"
                              value={ing.unit}
                              onChange={(e) => {
                                const ingredients = [...form.ingredients];
                                ingredients[index] = { ...ing, unit: e.target.value };
                                patch({ ingredients });
                              }}
                            />
                            <Input
                              placeholder="備註"
                              value={ing.substitution_notes}
                              onChange={(e) => {
                                const ingredients = [...form.ingredients];
                                ingredients[index] = { ...ing, substitution_notes: e.target.value };
                                patch({ ingredients });
                              }}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                patch({
                                  ingredients: form.ingredients.filter((x) => x.clientKey !== ing.clientKey),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </SortableRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  patch({
                    ingredients: [
                      ...form.ingredients,
                      {
                        clientKey: newKey("ing"),
                        name: "",
                        amount: "",
                        unit: "",
                        substitution_notes: "",
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                新增材料
              </Button>
            </SectionCard>

            {form.recipe_type === "article" ? (
              <SectionCard title="製作步驟">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onStepDragEnd}>
                  <SortableContext items={form.steps.map((s) => s.clientKey)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {form.steps.map((step, index) => (
                        <SortableRow key={step.clientKey} id={step.clientKey}>
                          {({ attributes, listeners }) => (
                            <div className="space-y-3 rounded-xl border border-[#E8E1D7] p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button type="button" className="text-[#8A94A6]" {...attributes} {...listeners}>
                                    <GripVertical className="h-4 w-4" />
                                  </button>
                                  <p className="text-sm font-semibold text-[#F16458]">
                                    STEP {String(index + 1).padStart(2, "0")}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const copy: StepDraft = {
                                        ...step,
                                        clientKey: newKey("step"),
                                      };
                                      const steps = [...form.steps];
                                      steps.splice(index + 1, 0, copy);
                                      patch({ steps });
                                    }}
                                  >
                                    <Copy className="mr-1 h-3.5 w-3.5" />
                                    複製
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      patch({
                                        steps: form.steps.filter((x) => x.clientKey !== step.clientKey),
                                      })
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <AdminImageUpload
                                images={step.image_url ? [step.image_url] : []}
                                onChange={(imgs) => {
                                  const steps = [...form.steps];
                                  steps[index] = { ...step, image_url: imgs[0] ?? "" };
                                  patch({ steps });
                                }}
                                multiple={false}
                                maxImages={1}
                                aspectRatio="video"
                                label="步驟圖片"
                                uploadFolder="recipes/steps"
                                bucket="product-images"
                              />
                              <textarea
                                className="min-h-[100px] w-full rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                                placeholder="步驟說明"
                                value={step.description}
                                onChange={(e) => {
                                  const steps = [...form.steps];
                                  steps[index] = { ...step, description: e.target.value };
                                  patch({ steps });
                                }}
                              />
                            </div>
                          )}
                        </SortableRow>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    patch({
                      steps: [
                        ...form.steps,
                        { clientKey: newKey("step"), title: "", description: "", image_url: "" },
                      ],
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  新增步驟
                </Button>
              </SectionCard>
            ) : null}

            <SectionCard title="小提醒 Tips">
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                value={form.tips}
                onChange={(e) => patch({ tips: e.target.value })}
                placeholder="例如：蛋液建議分 2～3 次加入"
              />
            </SectionCard>

            <SectionCard title="SEO 設定" defaultOpen={false}>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">SEO Title</span>
                <Input value={form.seo_title} onChange={(e) => patch({ seo_title: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">SEO Description</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-[#E8E1D7] px-3 py-2 text-sm"
                  value={form.seo_description}
                  onChange={(e) => patch({ seo_description: e.target.value })}
                />
              </label>
              <div>
                <p className="mb-2 text-sm font-medium">OG Image</p>
                <AdminImageUpload
                  images={form.seo_image ? [form.seo_image] : []}
                  onChange={(imgs) => patch({ seo_image: imgs[0] ?? "" })}
                  multiple={false}
                  maxImages={1}
                  label="OG"
                  uploadFolder="recipes/seo"
                  bucket="product-images"
                />
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className="rounded-xl border border-[#E8E1D7] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-[#153E73]">發布設定</h2>
              <div className="mt-3 space-y-2">
                {(
                  [
                    ["draft", "草稿"],
                    ["published", "上架"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={form.status === value}
                      onChange={() => patch({ status: value })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Button type="button" className="w-full" variant="outline" onClick={() => void persist({ ...form, status: "draft" })}>
                  儲存草稿
                </Button>
                <Button
                  type="button"
                  className="w-full bg-[#153E73] text-white hover:bg-[#0F2E56]"
                  onClick={() => void persist({ ...form, status: "published" }, { publish: true })}
                >
                  發布
                </Button>
                <Button type="button" className="w-full" variant="outline" onClick={() => void preview()}>
                  預覽
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
