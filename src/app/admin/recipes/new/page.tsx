"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { slugifyTitle } from "@/lib/videos/embed";

/** Minimal create: title only, then open the 4-step content editor. */
export default function AdminRecipeNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      alert("請填寫食譜名稱");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slugifyTitle(title),
          status: "draft",
          is_smart_recipe: true,
          flip_mode_enabled: true,
          full_reading_enabled: true,
          reading_mode_default: "flip",
          story_layout_mode: "auto",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "建立失敗");
      router.push(`/admin/recipes/${data.recipe.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <AdminPageHeader
        title="新增食譜"
        description="建立草稿後，以四步驟輸入基本資料、材料、步驟並自動產生翻頁。"
      />
      <div className="rounded-2xl border border-[#E8E1D7] bg-white p-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#153E73]">食譜名稱</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如 巧克力堅果軟餅乾"
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
            }}
          />
        </label>
        <Button
          className="mt-4 w-full bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? "建立中…" : "建立並開始編輯"}
        </Button>
      </div>
    </div>
  );
}
