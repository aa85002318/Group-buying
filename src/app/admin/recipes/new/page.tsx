"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { slugifyTitle } from "@/lib/videos/embed";
import type { RecipeCategory } from "@/lib/types/database";

type IngredientDraft = {
  group_name: string;
  name: string;
  amount: string;
  unit: string;
};

type StepDraft = {
  title: string;
  description: string;
  note: string;
};

export default function AdminRecipeNewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [saving, setSaving] = useState(false);
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
  });
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { group_name: "材料", name: "", amount: "", unit: "" },
  ]);
  const [steps, setSteps] = useState<StepDraft[]>([{ title: "", description: "", note: "" }]);

  useEffect(() => {
    fetch("/api/admin/recipes")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫標題");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug.trim() || slugifyTitle(form.title),
          cover_image: form.cover_image || null,
          category_id: form.category_id || null,
          prep_time: form.prep_time ? Number(form.prep_time) : null,
          cook_time: form.cook_time ? Number(form.cook_time) : null,
          total_time: form.total_time ? Number(form.total_time) : null,
          ingredients: ingredients.filter((i) => i.name.trim()),
          steps: steps
            .filter((s) => s.description.trim())
            .map((s, i) => ({ ...s, step_number: i + 1, sort_order: i })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      router.push(`/admin/recipes/${data.recipe.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="新增食譜" description="儲存草稿或直接發布" />

      <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
        <AdminImageUpload
          label="封面圖"
          hint="選填"
          images={form.cover_image ? [form.cover_image] : []}
          onChange={(images) => setForm({ ...form, cover_image: images[0] ?? "" })}
          uploadFolder="recipes"
          maxImages={1}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="標題"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="Slug（可自動產生）"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            設為精選
          </label>
        </div>

        <textarea
          className="input-field min-h-[72px]"
          placeholder="摘要"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />
        <textarea
          className="input-field min-h-[100px]"
          placeholder="簡介／內文"
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

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-coffee">材料</h3>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() =>
                setIngredients([...ingredients, { group_name: "材料", name: "", amount: "", unit: "" }])
              }
            >
              新增材料
            </Button>
          </div>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-4">
              <Input
                placeholder="分組"
                value={ing.group_name}
                onChange={(e) => {
                  const next = [...ingredients];
                  next[idx] = { ...ing, group_name: e.target.value };
                  setIngredients(next);
                }}
              />
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
                placeholder="用量"
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
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-coffee">步驟</h3>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setSteps([...steps, { title: "", description: "", note: "" }])}
            >
              新增步驟
            </Button>
          </div>
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border border-border p-3">
              <Input
                placeholder={`步驟 ${idx + 1} 標題`}
                value={step.title}
                onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...step, title: e.target.value };
                  setSteps(next);
                }}
              />
              <textarea
                className="input-field min-h-[72px]"
                placeholder="說明"
                value={step.description}
                onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...step, description: e.target.value };
                  setSteps(next);
                }}
              />
              <Input
                placeholder="注意事項（選填）"
                value={step.note}
                onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...step, note: e.target.value };
                  setSteps(next);
                }}
              />
            </div>
          ))}
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="SEO 標題"
            value={form.seo_title}
            onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
          />
          <Input
            placeholder="SEO 描述"
            value={form.seo_description}
            onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "儲存中…" : "儲存"}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/admin/recipes")}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
