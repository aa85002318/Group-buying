"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  newId,
  parseLatLngFromGoogleMapsUrl,
  STORE_GALLERY_CATEGORIES,
  STORE_SOCIAL_PLATFORMS,
  STORE_WEEKDAY_KEYS,
  STORE_WEEKDAY_LABELS,
  type StoreAnnouncement,
  type StoreGalleryCategory,
  type StoreGalleryItem,
  type StoreHoliday,
  type StoreProfile,
  type StoreSocialLink,
  type StoreVisibility,
  type StoreWeekdayKey,
} from "@/lib/admin/store-profile";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "basic", label: "基本資料" },
  { id: "social", label: "社群資訊" },
  { id: "hours", label: "營業資訊" },
  { id: "map", label: "Google Map" },
  { id: "images", label: "圖片" },
  { id: "announce", label: "公告" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  store: StoreProfile;
  onUpdated: (store: StoreProfile) => void;
};

export function StoreProfileEditor({ store, onUpdated }: Props) {
  const [tab, setTab] = useState<TabId>("basic");
  const [draft, setDraft] = useState<StoreProfile>(store);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);

  useEffect(() => {
    setDraft(store);
    skipFirst.current = true;
    setSaveState("idle");
    setError(null);
  }, [store.id]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persist(draft);
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosave on draft changes
  }, [draft]);

  const persist = async (next: StoreProfile) => {
    setSaveState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${next.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: next.name,
          code: next.code,
          address: next.address,
          phone: next.phone,
          email: next.email,
          line_at: next.line_at,
          description: next.description,
          notes: next.notes,
          weekly_hours: next.weekly_hours,
          holidays: next.holidays,
          pickup_hours: next.pickup_hours,
          map_url: next.map_url,
          navigation_url: next.map_url,
          latitude: next.latitude,
          longitude: next.longitude,
          line_url: next.line_url,
          logo_url: next.logo_url,
          cover_image_url: next.cover_image_url,
          image_url: next.cover_image_url,
          social_links: next.social_links,
          gallery: next.gallery,
          announcements: next.announcements,
          seo: next.seo,
          service_flags: next.service_flags,
          visibility: next.visibility,
          pickup_available: next.service_flags.pickup !== false,
          sort_order: next.sort_order,
          is_default: next.is_default,
          is_active: next.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      onUpdated(data.store as StoreProfile);
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      setError(e instanceof Error ? e.message : "儲存失敗");
    }
  };

  const patch = (partial: Partial<StoreProfile>) => {
    setDraft((d) => ({ ...d, ...partial }));
  };

  const patchVisibility = (key: keyof StoreVisibility, value: boolean) => {
    patch({ visibility: { ...draft.visibility, [key]: value } });
  };

  const setDay = (key: StoreWeekdayKey, field: "open" | "close" | "closed", value: string | boolean) => {
    const day = draft.weekly_hours[key] ?? { open: "09:00", close: "21:00" };
    const next = {
      ...draft.weekly_hours,
      [key]:
        field === "closed"
          ? { ...day, closed: Boolean(value) }
          : { ...day, [field]: String(value) },
    };
    patch({ weekly_hours: next });
  };

  return (
    <div className="flex min-h-[520px] flex-col rounded-[16px] border border-[#E9DED4] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9DED4] px-4 py-3">
        <div>
          <h2 className="font-semibold text-[#2F2925]">{draft.name || "未命名分店"}</h2>
          <p className="text-xs text-[#756B64]">
            {saveState === "saving" && "儲存中…"}
            {saveState === "saved" && "已自動儲存"}
            {saveState === "error" && (error ?? "儲存失敗")}
            {saveState === "idle" && "編輯後自動儲存"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => patch({ is_active: e.target.checked })}
            />
            啟用
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={draft.is_default}
              onChange={(e) => patch({ is_default: e.target.checked })}
            />
            預設門市
          </label>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#E9DED4] px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm",
              tab === t.id ? "bg-[#FFF5C7] font-medium text-[#153E73]" : "text-[#756B64] hover:bg-[#FFFBEA]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {tab === "basic" && (
          <>
            <Field label="門市名稱">
              <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="分店代碼">
              <Input value={draft.code ?? ""} onChange={(e) => patch({ code: e.target.value || null })} />
            </Field>
            <Field label="電話" hide={!draft.visibility.show_phone} onToggleHide={(v) => patchVisibility("show_phone", !v)}>
              <Input value={draft.phone ?? ""} onChange={(e) => patch({ phone: e.target.value || null })} />
            </Field>
            <Field label="Email" hide={!draft.visibility.show_email} onToggleHide={(v) => patchVisibility("show_email", !v)}>
              <Input value={draft.email ?? ""} onChange={(e) => patch({ email: e.target.value || null })} />
            </Field>
            <Field label="LINE@">
              <Input value={draft.line_at ?? ""} onChange={(e) => patch({ line_at: e.target.value || null })} />
            </Field>
            <Field label="地址">
              <Input value={draft.address} onChange={(e) => patch({ address: e.target.value })} />
            </Field>
            <Field
              label="門市介紹"
              hide={!draft.visibility.show_description}
              onToggleHide={(v) => patchVisibility("show_description", !v)}
            >
              <textarea
                className="input-field min-h-[120px] w-full rounded-[10px] border border-[#E9DED4] px-3 py-2 text-sm"
                value={draft.description ?? ""}
                onChange={(e) => patch({ description: e.target.value || null })}
              />
            </Field>
            <Field label="注意事項（取貨／結帳顯示）">
              <textarea
                className="input-field min-h-[80px] w-full rounded-[10px] border border-[#E9DED4] px-3 py-2 text-sm"
                value={draft.notes ?? ""}
                onChange={(e) => patch({ notes: e.target.value || null })}
              />
            </Field>
            <Field label="Logo 網址">
              <Input value={draft.logo_url ?? ""} onChange={(e) => patch({ logo_url: e.target.value || null })} />
            </Field>
            <div className="rounded-[12px] border border-[#E9DED4] bg-[#FAF6F1] p-3">
              <p className="mb-2 text-sm font-medium text-[#2F2925]">門市服務</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["pickup", "自取／取貨"],
                    ["frozen", "冷凍"],
                    ["chilled", "冷藏"],
                    ["parking", "停車"],
                    ["accessible", "無障礙"],
                    ["corporate", "企業取貨"],
                    ["classroom", "課程教室"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.service_flags[key])}
                      onChange={(e) =>
                        patch({
                          service_flags: { ...draft.service_flags, [key]: e.target.checked },
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-[12px] border border-[#E9DED4] bg-[#FAF6F1] p-3">
              <p className="mb-2 text-sm font-medium text-[#2F2925]">顯示於</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {(
                  [
                    ["website", "官網"],
                    ["app", "APP"],
                    ["pwa", "PWA"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={draft.visibility[key] !== false}
                      onChange={(e) => patchVisibility(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <label className="mt-3 block space-y-1 text-sm">
                <span className="text-[#756B64]">排序（數字越小越前）</span>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => patch({ sort_order: Number(e.target.value) || 0 })}
                />
              </label>
            </div>
          </>
        )}

        {tab === "social" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#756B64]">每個平台可獨立顯示／隱藏</p>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={draft.visibility.show_social !== false}
                  onChange={(e) => patchVisibility("show_social", e.target.checked)}
                />
                前台顯示社群區
              </label>
            </div>
            {STORE_SOCIAL_PLATFORMS.map((p) => {
              const link =
                draft.social_links.find((s) => s.platform === p.platform) ??
                ({ platform: p.platform, url: "", visible: false } as StoreSocialLink);
              return (
                <div
                  key={p.platform}
                  className="grid gap-2 rounded-[12px] border border-[#E9DED4] p-3 sm:grid-cols-[120px_1fr_auto]"
                >
                  <p className="text-sm font-medium text-[#2F2925]">{p.label}</p>
                  <Input
                    placeholder="https://"
                    value={link.url}
                    onChange={(e) => {
                      const next = draft.social_links.map((s) =>
                        s.platform === p.platform ? { ...s, url: e.target.value } : s
                      );
                      if (!draft.social_links.some((s) => s.platform === p.platform)) {
                        next.push({ ...link, url: e.target.value });
                      }
                      patch({ social_links: next });
                    }}
                  />
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={link.visible}
                      onChange={(e) => {
                        const next = draft.social_links.map((s) =>
                          s.platform === p.platform ? { ...s, visible: e.target.checked } : s
                        );
                        if (!draft.social_links.some((s) => s.platform === p.platform)) {
                          next.push({ ...link, visible: e.target.checked });
                        }
                        patch({ social_links: next });
                      }}
                    />
                    顯示
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {tab === "hours" && (
          <div className="space-y-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={draft.visibility.show_hours !== false}
                onChange={(e) => patchVisibility("show_hours", e.target.checked)}
              />
              前台顯示營業時間
            </label>
            {STORE_WEEKDAY_KEYS.map((key) => {
              const day = draft.weekly_hours[key] ?? { open: "09:00", close: "21:00" };
              return (
                <div key={key} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="w-16 font-medium text-[#2F2925]">{STORE_WEEKDAY_LABELS[key]}</span>
                  <Input
                    type="time"
                    className="w-32"
                    disabled={day.closed}
                    value={day.open}
                    onChange={(e) => setDay(key, "open", e.target.value)}
                  />
                  <span>~</span>
                  <Input
                    type="time"
                    className="w-32"
                    disabled={day.closed}
                    value={day.close}
                    onChange={(e) => setDay(key, "close", e.target.value)}
                  />
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={Boolean(day.closed)}
                      onChange={(e) => setDay(key, "closed", e.target.checked)}
                    />
                    公休
                  </label>
                </div>
              );
            })}
            <Field label="取貨時段說明">
              <Input
                value={draft.pickup_hours ?? ""}
                onChange={(e) => patch({ pickup_hours: e.target.value || null })}
                placeholder="例：平日 14:00–20:00 取貨"
              />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-[#2F2925]">特殊公休</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const item: StoreHoliday = {
                      id: newId(),
                      date: new Date().toISOString().slice(0, 10),
                      label: "",
                    };
                    patch({ holidays: [...draft.holidays, item] });
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  新增
                </Button>
              </div>
              <div className="space-y-2">
                {draft.holidays.map((h) => (
                  <div key={h.id} className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      className="w-40"
                      value={h.date}
                      onChange={(e) =>
                        patch({
                          holidays: draft.holidays.map((x) =>
                            x.id === h.id ? { ...x, date: e.target.value } : x
                          ),
                        })
                      }
                    />
                    <Input
                      className="min-w-[160px] flex-1"
                      placeholder="說明（例：元旦公休）"
                      value={h.label}
                      onChange={(e) =>
                        patch({
                          holidays: draft.holidays.map((x) =>
                            x.id === h.id ? { ...x, label: e.target.value } : x
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        patch({ holidays: draft.holidays.filter((x) => x.id !== h.id) })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "map" && (
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={draft.visibility.show_map !== false}
                onChange={(e) => patchVisibility("show_map", e.target.checked)}
              />
              前台顯示地圖／導航
            </label>
            <Field label="Google Map URL（APP 點擊導航）">
              <Input
                value={draft.map_url ?? ""}
                onChange={(e) => patch({ map_url: e.target.value || null })}
                placeholder="https://maps.google.com/..."
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const { latitude, longitude } = parseLatLngFromGoogleMapsUrl(draft.map_url ?? "");
                if (latitude == null && longitude == null) {
                  alert("無法解析經緯度，請確認連結含 @lat,lng");
                  return;
                }
                patch({ latitude, longitude });
              }}
            >
              📍 自動取得經緯度
            </Button>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Latitude">
                <Input
                  value={draft.latitude ?? ""}
                  onChange={(e) =>
                    patch({ latitude: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </Field>
              <Field label="Longitude">
                <Input
                  value={draft.longitude ?? ""}
                  onChange={(e) =>
                    patch({ longitude: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {tab === "images" && (
          <GalleryEditor
            coverUrl={draft.cover_image_url}
            gallery={draft.gallery}
            show={draft.visibility.show_gallery !== false}
            onShowChange={(v) => patchVisibility("show_gallery", v)}
            onCoverChange={(url) => patch({ cover_image_url: url, image_url: url })}
            onGalleryChange={(gallery) => patch({ gallery })}
          />
        )}

        {tab === "announce" && (
          <AnnounceEditor
            items={draft.announcements}
            show={draft.visibility.show_announcements !== false}
            onShowChange={(v) => patchVisibility("show_announcements", v)}
            onChange={(announcements) => patch({ announcements })}
          />
        )}

        {tab === "seo" && (
          <div className="space-y-3">
            <Field label="Slug（之後可用 /stores/你的slug）">
              <Input
                value={draft.seo.slug ?? ""}
                onChange={(e) =>
                  patch({ seo: { ...draft.seo, slug: e.target.value || undefined } })
                }
                placeholder="taipei"
              />
            </Field>
            <Field label="Meta Title">
              <Input
                value={draft.seo.title ?? ""}
                onChange={(e) =>
                  patch({ seo: { ...draft.seo, title: e.target.value || undefined } })
                }
              />
            </Field>
            <Field label="Meta Description">
              <textarea
                className="input-field min-h-[80px] w-full rounded-[10px] border border-[#E9DED4] px-3 py-2 text-sm"
                value={draft.seo.description ?? ""}
                onChange={(e) =>
                  patch({ seo: { ...draft.seo, description: e.target.value || undefined } })
                }
              />
            </Field>
            <Field label="OG 圖片網址">
              <Input
                value={draft.seo.og_image ?? ""}
                onChange={(e) =>
                  patch({ seo: { ...draft.seo, og_image: e.target.value || undefined } })
                }
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hide,
  onToggleHide,
}: {
  label: string;
  children: React.ReactNode;
  hide?: boolean;
  onToggleHide?: (hidden: boolean) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="flex items-center justify-between gap-2 text-[#756B64]">
        <span>{label}</span>
        {onToggleHide ? (
          <button
            type="button"
            className="text-xs text-[#6F4E37] underline"
            onClick={(e) => {
              e.preventDefault();
              onToggleHide(!hide);
            }}
          >
            {hide ? "已隱藏（點擊顯示）" : "顯示中（點擊隱藏）"}
          </button>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function GalleryEditor({
  coverUrl,
  gallery,
  show,
  onShowChange,
  onCoverChange,
  onGalleryChange,
}: {
  coverUrl: string | null;
  gallery: StoreGalleryItem[];
  show: boolean;
  onShowChange: (v: boolean) => void;
  onCoverChange: (url: string | null) => void;
  onGalleryChange: (items: StoreGalleryItem[]) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  const addImage = (category: StoreGalleryCategory) => {
    const url = window.prompt("請貼上圖片網址");
    if (!url?.trim()) return;
    if (category === "cover") {
      onCoverChange(url.trim());
      return;
    }
    const item: StoreGalleryItem = {
      id: newId(),
      category,
      url: url.trim(),
      sort_order: gallery.length,
    };
    onGalleryChange([...gallery, item]);
  };

  const sorted = [...gallery].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
        前台顯示圖片區
      </label>
      <Field label="門市封面（1500×600）">
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-[200px] flex-1"
            value={coverUrl ?? ""}
            onChange={(e) => onCoverChange(e.target.value || null)}
            placeholder="封面圖網址"
          />
          <Button type="button" variant="outline" onClick={() => addImage("cover")}>
            貼上網址
          </Button>
        </div>
      </Field>
      {STORE_GALLERY_CATEGORIES.filter((c) => c.id !== "cover").map((cat) => (
        <div key={cat.id} className="rounded-[12px] border border-[#E9DED4] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#2F2925]">{cat.label}</p>
              <p className="text-xs text-[#756B64]">{cat.hint} · 拖曳排序</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => addImage(cat.id)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              新增
            </Button>
          </div>
          <div className="space-y-2">
            {sorted
              .filter((g) => g.category === cat.id)
              .map((g) => (
                <div
                  key={g.id}
                  draggable
                  onDragStart={() => setDragId(g.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragId || dragId === g.id) return;
                    const ids = sorted.map((x) => x.id);
                    const from = ids.indexOf(dragId);
                    const to = ids.indexOf(g.id);
                    if (from < 0 || to < 0) return;
                    const nextIds = [...ids];
                    nextIds.splice(from, 1);
                    nextIds.splice(to, 0, dragId);
                    onGalleryChange(
                      gallery.map((item) => ({
                        ...item,
                        sort_order: nextIds.indexOf(item.id),
                      }))
                    );
                    setDragId(null);
                  }}
                  className="flex items-center gap-2 rounded-[10px] border border-[#E9DED4] bg-[#FAF6F1] px-2 py-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-[#756B64]" />
                  <Input
                    className="flex-1"
                    value={g.url}
                    onChange={(e) =>
                      onGalleryChange(
                        gallery.map((x) => (x.id === g.id ? { ...x, url: e.target.value } : x))
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onGalleryChange(gallery.filter((x) => x.id !== g.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnnounceEditor({
  items,
  show,
  onShowChange,
  onChange,
}: {
  items: StoreAnnouncement[];
  show: boolean;
  onShowChange: (v: boolean) => void;
  onChange: (items: StoreAnnouncement[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          前台顯示公告區
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...items,
              {
                id: newId(),
                body: "",
                visible: true,
                starts_at: null,
                ends_at: null,
              },
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          新增公告
        </Button>
      </div>
      {items.map((a) => (
        <div key={a.id} className="space-y-2 rounded-[12px] border border-[#E9DED4] p-3">
          <textarea
            className="input-field min-h-[72px] w-full rounded-[10px] border border-[#E9DED4] px-3 py-2 text-sm"
            placeholder="例：今天營業至 18:00"
            value={a.body}
            onChange={(e) =>
              onChange(items.map((x) => (x.id === a.id ? { ...x, body: e.target.value } : x)))
            }
          />
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={a.visible}
              onChange={(e) =>
                onChange(
                  items.map((x) => (x.id === a.id ? { ...x, visible: e.target.checked } : x))
                )
              }
            />
            顯示
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-[#756B64]">開始</span>
              <Input
                type="datetime-local"
                value={a.starts_at?.slice(0, 16) ?? ""}
                onChange={(e) =>
                  onChange(
                    items.map((x) =>
                      x.id === a.id
                        ? { ...x, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null }
                        : x
                    )
                  )
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-[#756B64]">結束</span>
              <Input
                type="datetime-local"
                value={a.ends_at?.slice(0, 16) ?? ""}
                onChange={(e) =>
                  onChange(
                    items.map((x) =>
                      x.id === a.id
                        ? { ...x, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null }
                        : x
                    )
                  )
                }
              />
            </label>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange(items.filter((x) => x.id !== a.id))}
          >
            刪除
          </Button>
        </div>
      ))}
    </div>
  );
}
