"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import type { PageLayoutSetting, PageLayoutSettingsJson } from "@/lib/layout/page-layout-settings";

const PREVIEW_WIDTHS = [1024, 1280, 1440, 1920] as const;

function asSettings(raw: unknown): PageLayoutSettingsJson {
  return raw && typeof raw === "object" ? (raw as PageLayoutSettingsJson) : {};
}

export default function AdminDesktopLayoutHomePage() {
  const [settings, setSettings] = useState<PageLayoutSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<(typeof PREVIEW_WIDTHS)[number]>(1440);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/layout-settings?page_key=home&platform=desktop")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? []))
      .catch(() => setSettings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateRow = (id: string, patch: Partial<PageLayoutSetting>) => {
    setSettings((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateSettingsJson = (id: string, patch: PageLayoutSettingsJson) => {
    setSettings((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              settings_json: { ...asSettings(row.settings_json), ...patch },
            }
          : row
      )
    );
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setSettings((prev) => {
      const next = [...prev].sort((a, b) => a.sort_order - b.sort_order);
      const from = next.findIndex((r) => r.id === dragId);
      const to = next.findIndex((r) => r.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((row, i) => ({ ...row, sort_order: i + 1 }));
    });
    setDragId(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/layout-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: settings.map((s) => ({
            id: s.id,
            enabled: s.enabled,
            sort_order: s.sort_order,
            columns: s.columns,
            display_limit: s.display_limit,
            layout_type: s.layout_type,
            settings_json: s.settings_json,
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setMessage("已儲存網頁版首頁設定（僅影響 Desktop layout）");
      if (d.settings?.length) setSettings(d.settings);
      else load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const ordered = [...settings].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 py-2 md:px-0">
      <AdminPageHeader
        title="網頁版首頁設定"
        description="僅調整 Desktop ≥1024 版型。App／手機版與商品／食譜資料完全不受影響。"
        actions={
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "儲存中…" : "儲存設定"}
          </Button>
        }
      />

      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      ) : null}

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#153E73]">預覽 Desktop</h2>
          <div className="flex flex-wrap gap-2">
            {PREVIEW_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setPreviewWidth(w)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  previewWidth === w
                    ? "bg-[#153E73] text-white"
                    : "bg-[#F5F0E8] text-[#5E4035]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-auto rounded-lg border bg-[#FFFDF9] p-3">
          <div
            className="mx-auto overflow-hidden rounded-md border bg-white shadow-sm"
            style={{ width: Math.min(previewWidth, 960), maxWidth: "100%" }}
          >
            <iframe
              title="Desktop home preview"
              src="/?desktop_preview=1"
              className="h-[420px] w-full border-0"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            預覽以目前 staging 前台為準。請用瀏覽器另開寬螢幕確認實際 Desktop V2。
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-4 text-sm font-bold text-[#153E73]">首頁區塊</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : (
          <ul className="space-y-3">
            {ordered.map((row) => {
              const cfg = asSettings(row.settings_json);
              return (
                <li
                  key={row.id}
                  draggable
                  onDragStart={() => setDragId(row.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(row.id)}
                  className="cursor-grab rounded-xl border border-[#EDE6DC] bg-[#FFFEFA] p-4 active:cursor-grabbing"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#153E73]">
                        ≡ {String(cfg.title ?? row.section_key)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.section_key} · 排序 {row.sort_order} ·{" "}
                        {row.layout_type || "—"}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => updateRow(row.id, { enabled: e.target.checked })}
                      />
                      顯示
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs">
                      欄數
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={row.columns ?? ""}
                        onChange={(e) =>
                          updateRow(row.id, {
                            columns: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="text-xs">
                      顯示數量
                      <input
                        type="number"
                        min={1}
                        max={48}
                        value={row.display_limit ?? ""}
                        onChange={(e) =>
                          updateRow(row.id, {
                            display_limit: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="text-xs">
                      圖片比例
                      <input
                        value={String(cfg.imageRatio ?? "")}
                        onChange={(e) =>
                          updateSettingsJson(row.id, { imageRatio: e.target.value })
                        }
                        placeholder="4:3"
                        className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                      />
                    </label>
                  </div>

                  {row.section_key === "hero" ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="text-xs">
                        Hero 比例
                        <select
                          value={String(cfg.heroRatio ?? "5:2")}
                          onChange={(e) =>
                            updateSettingsJson(row.id, {
                              heroRatio: e.target.value as PageLayoutSettingsJson["heroRatio"],
                            })
                          }
                          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                        >
                          <option value="5:2">5:2</option>
                          <option value="16:9">16:9</option>
                          <option value="custom">自訂</option>
                        </select>
                      </label>
                      <label className="text-xs">
                        最大高度 (px)
                        <input
                          type="number"
                          value={Number(cfg.heroMaxHeight ?? 600)}
                          onChange={(e) =>
                            updateSettingsJson(row.id, {
                              heroMaxHeight: Number(e.target.value) || 600,
                            })
                          }
                          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="flex items-center gap-2 pt-5 text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean(cfg.useDesktopImage)}
                          onChange={(e) =>
                            updateSettingsJson(row.id, { useDesktopImage: e.target.checked })
                          }
                        />
                        優先使用桌機專用圖片
                      </label>
                    </div>
                  ) : null}

                  {row.section_key === "popular_products" ||
                  row.section_key === "ingredient_shop" ? (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      {(
                        [
                          ["showName", "商品名稱"],
                          ["showSpec", "規格"],
                          ["showPrice", "售價"],
                          ["showFavorite", "收藏"],
                          ["showAddToCart", "加入購物車"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={cfg[key] !== false}
                            onChange={(e) =>
                              updateSettingsJson(row.id, { [key]: e.target.checked })
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {row.section_key === "featured_recipes" ? (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      {(
                        [
                          ["showPrepTime", "製作時間"],
                          ["showDifficulty", "難度"],
                          ["showFavorite", "收藏"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={cfg[key] !== false}
                            onChange={(e) =>
                              updateSettingsJson(row.id, { [key]: e.target.checked })
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
