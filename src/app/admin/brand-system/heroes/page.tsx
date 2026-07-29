"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
type Tag = {
  id: string;
  label: string;
  keyword: string;
  linkType: "search" | "url";
  targetUrl: string | null;
  sortOrder: number;
  enabled: boolean;
};

type HeroRow = {
  id: string;
  hero_key: string;
  name: string;
  title: string;
  subtitle: string | null;
  show_title: boolean;
  show_subtitle: boolean;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  image_alt: string | null;
  image_position: "left" | "center" | "right";
  search_placeholder: string | null;
  search_scope: string;
  show_popular_tags: boolean;
  tags?: Tag[];
  enabled: boolean;
  status: string;
  updated_at: string;
};

const IMAGE_SPEC = `Hero 背景圖固定為 16:9。
建議桌機尺寸：1920×1080px 或 1600×900px
建議手機尺寸：1280×720px 或 960×540px
格式：WebP、JPG、PNG（桌機 ≤ 700KB，手機 ≤ 450KB）
圖片左側請預留主標題空間，底部預留搜尋欄區域。`;

function newTag(): Tag {
  return {
    id: `tag-${Date.now()}`,
    label: "",
    keyword: "",
    linkType: "search",
    targetUrl: null,
    sortOrder: 99,
    enabled: true,
  };
}

/* ─── Tag editor ─── */
function TagEditor({
  tags,
  onChange,
}: {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
}) {
  const update = (idx: number, patch: Partial<Tag>) => {
    const next = [...tags];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const remove = (idx: number) => onChange(tags.filter((_, i) => i !== idx));
  const add = () => onChange([...tags, newTag()]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-coffee">熱門搜尋標籤</p>
        <Button size="sm" variant="outline" onClick={add}>
          + 新增標籤
        </Button>
      </div>
      {tags.length === 0 ? (
        <p className="text-xs text-muted-foreground">尚無標籤，點右上新增</p>
      ) : (
        <div className="space-y-2">
          {tags.map((tag, idx) => (
            <div
              key={tag.id}
              className="grid gap-2 rounded-lg border border-border bg-surface-soft/50 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Input
                value={tag.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="顯示名稱（≤10字）"
                maxLength={10}
              />
              <Input
                value={tag.keyword}
                onChange={(e) => update(idx, { keyword: e.target.value })}
                placeholder="搜尋關鍵字"
              />
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-white px-2 text-sm"
                  value={tag.linkType}
                  onChange={(e) =>
                    update(idx, { linkType: e.target.value as Tag["linkType"] })
                  }
                >
                  <option value="search">搜尋</option>
                  <option value="url">自訂連結</option>
                </select>
                <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={tag.enabled}
                    onChange={(e) => update(idx, { enabled: e.target.checked })}
                  />
                  啟用
                </label>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-sm text-danger hover:underline"
                >
                  刪除
                </button>
              </div>
              {tag.linkType === "url" ? (
                <Input
                  className="sm:col-span-3"
                  value={tag.targetUrl ?? ""}
                  onChange={(e) => update(idx, { targetUrl: e.target.value || null })}
                  placeholder="自訂 URL（/path 或 https://…）"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Hero edit form ─── */
function HeroEditForm({
  editing,
  setEditing,
  saving,
  onSave,
}: {
  editing: HeroRow;
  setEditing: (h: HeroRow | null) => void;
  saving: boolean;
  onSave: (publish: boolean) => void;
}) {
  const tags: Tag[] = editing.tags ?? [];

  return (
    <div className="space-y-5 rounded-xl border border-border bg-white p-5 shadow-card">
      <p className="font-semibold text-coffee">
        編輯 Hero：{editing.name}{" "}
        <span className="text-xs font-normal text-muted-foreground">({editing.hero_key})</span>
      </p>

      {/* Background images */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-coffee">背景板</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">桌機版 16:9 背景圖片 URL</label>
            <Input
              value={editing.desktop_image_url ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, desktop_image_url: e.target.value || null })
              }
              placeholder="https://… (推薦 1920×1080px，≤700KB)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">手機版 16:9 背景圖片 URL</label>
            <Input
              value={editing.mobile_image_url ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, mobile_image_url: e.target.value || null })
              }
              placeholder="https://… (推薦 1280×720px，≤450KB)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">圖片替代文字（Alt）</label>
            <Input
              value={editing.image_alt ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, image_alt: e.target.value || null })
              }
              placeholder="圖片描述（SEO 用）"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">圖片焦點位置</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              value={editing.image_position}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  image_position: e.target.value as HeroRow["image_position"],
                })
              }
            >
              <option value="left">靠左</option>
              <option value="center">置中</option>
              <option value="right">靠右</option>
            </select>
          </div>
        </div>
        <p className="whitespace-pre-line rounded-lg bg-surface-soft px-3 py-2 text-xs text-muted-foreground">
          {IMAGE_SPEC}
        </p>
      </section>

      {/* Title / Subtitle */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-coffee">上方文字</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.show_title}
              onChange={(e) => setEditing({ ...editing, show_title: e.target.checked })}
            />
            顯示主標題
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.show_subtitle}
              onChange={(e) =>
                setEditing({ ...editing, show_subtitle: e.target.checked })
              }
            />
            顯示副標題
          </label>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">主標題（≤20字）</label>
            <Input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="今天想做什麼？"
              maxLength={20}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">副標題（≤50字）</label>
            <Input
              value={editing.subtitle ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, subtitle: e.target.value || null })
              }
              placeholder="從食譜開始，輕鬆完成每一個烘焙時刻"
              maxLength={50}
            />
          </div>
        </div>
      </section>

      {/* Search settings */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-coffee">搜尋設定</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">搜尋提示文字</label>
            <Input
              value={editing.search_placeholder ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, search_placeholder: e.target.value || null })
              }
              placeholder="搜尋食譜、材料、商品、課程……"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">搜尋範圍</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              value={editing.search_scope}
              onChange={(e) => setEditing({ ...editing, search_scope: e.target.value })}
            >
              <option value="global">全站搜尋</option>
              <option value="recipes">食譜</option>
              <option value="products">商品</option>
              <option value="courses">課程</option>
              <option value="group_buy">團購</option>
            </select>
          </div>
        </div>
      </section>

      {/* Popular tags */}
      <section className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-coffee">
          <input
            type="checkbox"
            checked={editing.show_popular_tags}
            onChange={(e) =>
              setEditing({ ...editing, show_popular_tags: e.target.checked })
            }
          />
          顯示熱門搜尋
        </label>
        {editing.show_popular_tags ? (
          <TagEditor
            tags={tags}
            onChange={(t) => setEditing({ ...editing, tags: t })}
          />
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button disabled={saving} onClick={() => onSave(false)}>
          儲存草稿
        </Button>
        <Button disabled={saving} onClick={() => onSave(true)}>
          立即發布
        </Button>
        <Button variant="outline" onClick={() => setEditing(null)}>
          取消
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function AdminBrandHeroesPage() {
  const [heroes, setHeroes] = useState<HeroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/brand-system/heroes")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setHeroes(d.heroes ?? []);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (publish = false) => {
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brand-system/heroes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          status: publish ? "published" : editing.status,
          enabled: publish ? true : editing.enabled,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setMessage(publish ? "已發布" : "已儲存草稿");
      setEditing(null);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="首頁 Hero 搜尋區"
        description="管理各頁主視覺背景圖片、標題文字、搜尋提示與熱門搜尋標籤。樣式幾何由 Brand System 固定，後台不可修改。"
        actions={
          <Link
            href="/admin/brand-system"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            返回總覽
          </Link>
        }
      />

      {message ? (
        <p className="rounded-lg bg-surface-soft px-3 py-2 text-sm text-coffee">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <ul className="space-y-3">
          {heroes.map((h) => (
            <li key={h.id} className="rounded-xl border border-border bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-coffee">
                    {h.name}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({h.hero_key})
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{h.title}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    h.status === "published"
                      ? "bg-success-soft text-success"
                      : "bg-disabled-soft text-disabled"
                  )}
                >
                  {h.status}
                </span>
                <Button size="sm" variant="outline" onClick={() => setEditing(h)}>
                  編輯
                </Button>
              </div>
            </li>
          ))}
          {!heroes.length ? (
            <li className="text-sm text-muted-foreground">
              尚無 Hero。請確認已套用 brand_experience_system migration。
            </li>
          ) : null}
        </ul>
      )}

      {editing ? (
        <HeroEditForm
          editing={editing}
          setEditing={setEditing}
          saving={saving}
          onSave={(publish) => void save(publish)}
        />
      ) : null}
    </div>
  );
}
