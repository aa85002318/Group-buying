"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeStep } from "@/lib/types/database";

type IngredientDraft = {
  group_name: string;
  name: string;
  amount: string;
  unit: string;
  product_id: string;
};

type StepDraft = {
  title: string;
  description: string;
  note: string;
};

export default function AdminRecipeEditPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [steps, setSteps] = useState<StepDraft[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/recipes/${id}`).then((r) => r.json()),
      fetch("/api/admin/recipes").then((r) => r.json()),
    ])
      .then(([detail, list]) => {
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
        });
        setIngredients(
          (r.recipe_ingredients ?? []).map((ing: RecipeIngredient) => ({
            group_name: ing.group_name ?? "",
            name: ing.name,
            amount: ing.amount ?? "",
            unit: ing.unit ?? "",
            product_id: ing.product_id ?? "",
          }))
        );
        setSteps(
          (r.recipe_steps ?? []).map((s: RecipeStep) => ({
            title: s.title ?? "",
            description: s.description,
            note: s.note ?? "",
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
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
      alert("已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">載入中…</p>;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={`編輯食譜：${form.title || id}`}
        description="草稿／發布／下架與材料步驟管理"
        actions={
          <div className="flex gap-2">
            <Link href={`/recipes/${form.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">預覽</Button>
            </Link>
            <Button variant="secondary" onClick={() => router.push("/admin/recipes")}>
              返回列表
            </Button>
          </div>
        }
      />

      <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
        <AdminImageUpload
          label="封面圖"
          images={form.cover_image ? [form.cover_image] : []}
          onChange={(images) => setForm({ ...form, cover_image: images[0] ?? "" })}
          uploadFolder="recipes"
          maxImages={1}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="標題" />
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" />
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
          <Input type="number" placeholder="準備時間" value={form.prep_time} onChange={(e) => setForm({ ...form, prep_time: e.target.value })} />
          <Input type="number" placeholder="烘烤時間" value={form.cook_time} onChange={(e) => setForm({ ...form, cook_time: e.target.value })} />
          <Input type="number" placeholder="總時間" value={form.total_time} onChange={(e) => setForm({ ...form, total_time: e.target.value })} />
          <Input placeholder="份量" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} />
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">草稿</option>
            <option value="scheduled">排程</option>
            <option value="published">發布</option>
            <option value="archived">下架</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            精選
          </label>
        </div>

        <textarea className="input-field min-h-[72px]" placeholder="摘要" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <textarea className="input-field min-h-[100px]" placeholder="簡介" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <textarea className="input-field min-h-[72px]" placeholder="製作重點" value={form.tips} onChange={(e) => setForm({ ...form, tips: e.target.value })} />
        <textarea className="input-field min-h-[72px]" placeholder="保存方式" value={form.storage_method} onChange={(e) => setForm({ ...form, storage_method: e.target.value })} />

        <section className="space-y-2">
          <div className="flex justify-between">
            <h3 className="font-medium">材料</h3>
            <Button size="sm" variant="outline" type="button" onClick={() => setIngredients([...ingredients, { group_name: "材料", name: "", amount: "", unit: "", product_id: "" }])}>
              新增
            </Button>
          </div>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-4">
              <Input placeholder="分組" value={ing.group_name} onChange={(e) => { const n = [...ingredients]; n[idx] = { ...ing, group_name: e.target.value }; setIngredients(n); }} />
              <Input placeholder="名稱" value={ing.name} onChange={(e) => { const n = [...ingredients]; n[idx] = { ...ing, name: e.target.value }; setIngredients(n); }} />
              <Input placeholder="用量" value={ing.amount} onChange={(e) => { const n = [...ingredients]; n[idx] = { ...ing, amount: e.target.value }; setIngredients(n); }} />
              <Input placeholder="單位" value={ing.unit} onChange={(e) => { const n = [...ingredients]; n[idx] = { ...ing, unit: e.target.value }; setIngredients(n); }} />
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <div className="flex justify-between">
            <h3 className="font-medium">步驟</h3>
            <Button size="sm" variant="outline" type="button" onClick={() => setSteps([...steps, { title: "", description: "", note: "" }])}>
              新增
            </Button>
          </div>
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border p-3">
              <Input placeholder="標題" value={step.title} onChange={(e) => { const n = [...steps]; n[idx] = { ...step, title: e.target.value }; setSteps(n); }} />
              <textarea className="input-field min-h-[72px]" placeholder="說明" value={step.description} onChange={(e) => { const n = [...steps]; n[idx] = { ...step, description: e.target.value }; setSteps(n); }} />
              <Input placeholder="注意事項" value={step.note} onChange={(e) => { const n = [...steps]; n[idx] = { ...step, note: e.target.value }; setSteps(n); }} />
            </div>
          ))}
        </section>

        <Button onClick={save} disabled={saving}>
          {saving ? "儲存中…" : "儲存變更"}
        </Button>
      </div>
    </div>
  );
}
