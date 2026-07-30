"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
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
  capsule_label: string | null;
  show_title: boolean;
  show_subtitle: boolean;
  show_ctas: boolean;
  primary_cta_label: string | null;
  primary_cta_href: string | null;
  secondary_cta_label: string | null;
  secondary_cta_href: string | null;
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

const IMAGE_SPEC = `Hero Banner 主視覺圖（可隨時替換）。
建議尺寸：1600×900 或 1024×576（約 16:9）
高度視覺約 340–360px，圓角 32px，底部會自動套用波浪漸層銜接。
格式：WebP / JPG / PNG（桌機 ≤ 700KB，手機 ≤ 450KB）
若上傳完整 Banner（含文案與 IP 插圖），請關閉「顯示主標題／副標題」避免重複。`;

function normalizeHeroForEdit(h: HeroRow & { brand_hero_tags?: Array<Record<string, unknown>> }): HeroRow {
  const rawTags = h.tags ?? h.brand_hero_tags ?? [];
  const tags: Tag[] = (rawTags as Array<Record<string, unknown>>).map((t) => ({
    id: String(t.id ?? `tag-${Date.now()}`),
    label: String(t.label ?? ""),
    keyword: String(t.keyword ?? t.label ?? ""),
    linkType: t.link_type === "url" || t.linkType === "url" ? "url" : "search",
    targetUrl: t.target_url ? String(t.target_url) : t.targetUrl ? String(t.targetUrl) : null,
    sortOrder: Number(t.sort_order ?? t.sortOrder ?? 0),
    enabled: t.enabled !== false,
  }));
  return {
    ...h,
    capsule_label: h.capsule_label ?? null,
    show_ctas: h.show_ctas === true,
    primary_cta_label: h.primary_cta_label ?? null,
    primary_cta_href: h.primary_cta_href ?? null,
    secondary_cta_label: h.secondary_cta_label ?? null,
    secondary_cta_href: h.secondary_cta_href ?? null,
    tags,
  };
}

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
        <p className="text-sm font-medium text-coffee">熱門搜尋 Chips（可含 emoji）</p>
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
                placeholder="顯示名稱（例：🥐 佛卡夏）"
                maxLength={16}
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

      {/* Banner images */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-coffee">Hero Banner 圖片（可替換）</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminImageUpload
            label="桌機版 Banner"
            hint="建議 1600×900，可含 IP 插圖與文案"
            images={editing.desktop_image_url ? [editing.desktop_image_url] : []}
            onChange={(urls) =>
              setEditing({ ...editing, desktop_image_url: urls[0] ?? null })
            }
            uploadFolder="brand-heroes"
            maxImages={1}
            multiple={false}
            aspectRatio="video"
          />
          <AdminImageUpload
            label="手機版 Banner"
            hint="未設定則使用桌機圖；建議 ≤450KB"
            images={editing.mobile_image_url ? [editing.mobile_image_url] : []}
            onChange={(urls) =>
              setEditing({ ...editing, mobile_image_url: urls[0] ?? null })
            }
            uploadFolder="brand-heroes"
            maxImages={1}
            multiple={false}
            aspectRatio="video"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
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

      {/* Overlay text */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-coffee">疊加文案（完整 Banner 圖建議關閉）</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-muted-foreground">膠囊標籤</label>
            <Input
              value={editing.capsule_label ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, capsule_label: e.target.value || null })
              }
              placeholder="✨ CHIMEiDIY Lifestyle"
            />
          </div>
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
            <label className="text-xs text-muted-foreground">主標題（≤24字）</label>
            <Input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="今天想做點什麼？"
              maxLength={24}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">副標題</label>
            <Input
              value={editing.subtitle ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, subtitle: e.target.value || null })
              }
              placeholder="探索食譜、團購、生鮮、居家好物"
              maxLength={80}
            />
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-coffee">
          <input
            type="checkbox"
            checked={editing.show_ctas === true}
            onChange={(e) => setEditing({ ...editing, show_ctas: e.target.checked })}
          />
          顯示按鈕（立即逛逛 / 看看食譜）
        </label>
        {editing.show_ctas ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={editing.primary_cta_label ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, primary_cta_label: e.target.value || null })
              }
              placeholder="主按鈕文字（立即逛逛）"
            />
            <Input
              value={editing.primary_cta_href ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, primary_cta_href: e.target.value || null })
              }
              placeholder="主按鈕連結（/products）"
            />
            <Input
              value={editing.secondary_cta_label ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, secondary_cta_label: e.target.value || null })
              }
              placeholder="次按鈕文字（看看食譜）"
            />
            <Input
              value={editing.secondary_cta_href ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, secondary_cta_href: e.target.value || null })
              }
              placeholder="次按鈕連結（/recipes）"
            />
          </div>
        ) : null}
      </section>

      {/* Search settings */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-coffee">漂浮搜尋欄</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">搜尋提示文字</label>
            <Input
              value={editing.search_placeholder ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, search_placeholder: e.target.value || null })
              }
              placeholder="今天想做什麼？搜尋食譜、商品、團購、生鮮…"
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
      setMessage(publish ? "已發布，前台將立即更新" : "已儲存草稿（需按「立即發布」前台才會更新）");
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
        title="首頁 Hero Banner"
        description="管理 Hero 主視覺圖片（可替換）、疊加文案、漂浮搜尋與熱門搜尋 Chips。波浪漸層與搜尋欄樣式由 Brand System 固定。"
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
              <div className="flex flex-wrap items-center gap-3">
                {h.desktop_image_url || h.mobile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.desktop_image_url || h.mobile_image_url || ""}
                    alt=""
                    className="h-14 w-24 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-14 w-24 items-center justify-center rounded-lg bg-[#FFD454]/40 text-[10px] text-[#153E73]">
                    無圖
                  </div>
                )}
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
                <Button size="sm" variant="outline" onClick={() => setEditing(normalizeHeroForEdit(h))}>
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
