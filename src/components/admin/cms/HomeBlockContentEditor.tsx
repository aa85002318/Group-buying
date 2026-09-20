"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { CmsBlock } from "@/types/cms";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import {
  CmsLinkPicker,
  cmsLinkFromHref,
  hrefFromCmsLink,
} from "@/components/admin/home/CmsLinkPicker";
import { LatestCampaignEditor } from "@/components/admin/home/LatestCampaignEditor";
import { QuickServicesEditor } from "@/components/admin/home/QuickServicesEditor";
import { RecipePickerEditor } from "@/components/admin/home/RecipePickerEditor";
import { ServiceShortcutsEditor } from "@/components/admin/home/ServiceShortcutsEditor";
import { GroupBuyBannerPanel } from "@/components/admin/home/HomeCmsStudio";
import { BannerSlotManager } from "@/components/admin/banners/BannerSlotManager";
import { parseLatestCampaignSettings } from "@/types/home-latest-campaign";
import { parseQuickServicesSettings } from "@/types/home-quick-service";
import { parseServiceShortcuts } from "@/lib/home/service-shortcuts";
import { parseGroupBuyBannerSettings } from "@/types/home-group-buy-banner";
import { DESKTOP_HOME_HERO_PLACEMENT } from "@/lib/desktop/inner-page-config";
import { PAGE_HERO_SIZE } from "@/lib/page-heroes";

type Patch = (patch: Partial<CmsBlock>) => void;

export function homeBlockKey(block: CmsBlock): string {
  return String(block.sourceKey || block.settings.legacyKey || block.type || "");
}

function cfgOf(block: CmsBlock): Record<string, unknown> {
  const c = block.settings.config;
  return c && typeof c === "object" ? (c as Record<string, unknown>) : {};
}

function setSettings(block: CmsBlock, onChange: Patch, patch: Record<string, unknown>) {
  onChange({ settings: { ...block.settings, ...patch } });
}

function setConfig(block: CmsBlock, onChange: Patch, patch: Record<string, unknown>) {
  onChange({ settings: { ...block.settings, config: { ...cfgOf(block), ...patch } } });
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[#153E73]">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-[#8A94A6]">{hint}</span> : null}
    </label>
  );
}

function LinkInput({ value, onChange }: { value: string; onChange: (href: string) => void }) {
  return <CmsLinkPicker value={cmsLinkFromHref(value)} onChange={(v) => onChange(hrefFromCmsLink(v))} />;
}

type ProductLite = { id: string; name: string; image_url?: string | null; price?: number | null };

/** Search the catalogue and hand-pick products (order = display order). */
function ProductPicker({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [all, setAll] = useState<ProductLite[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setAll((d.products ?? []) as ProductLite[]))
      .catch(() => {});
  }, []);
  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return all.filter((p) => !ids.includes(p.id) && p.name.toLowerCase().includes(n)).slice(0, 8);
  }, [all, ids, q]);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <Input value={q} placeholder="搜尋商品名稱後點選加入" onChange={(e) => setQ(e.target.value)} />
      {results.length ? (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-[#E9EDF2]">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-[#FFFDF6]"
                onClick={() => {
                  onChange([...ids, p.id]);
                  setQ("");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <span className="h-8 w-8 rounded bg-[#F2F4F7]" />}
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <Plus className="h-3.5 w-3.5 text-[#79C7E8]" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {ids.length ? (
        <ol className="space-y-1">
          {ids.map((id, i) => {
            const p = byId.get(id);
            return (
              <li key={id} className="flex items-center gap-2 rounded-lg bg-[#FAFBFC] px-2 py-1.5 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p?.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <span className="h-8 w-8 rounded bg-[#F2F4F7]" />}
                <span className="min-w-0 flex-1 truncate">{p?.name ?? "（商品已下架或刪除）"}</span>
                <button type="button" title="上移" onClick={() => move(i, -1)} className="p-1 text-[#687386]"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" title="下移" onClick={() => move(i, 1)} className="p-1 text-[#687386]"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" title="移除" onClick={() => onChange(ids.filter((x) => x !== id))} className="p-1 text-[#B42318]"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-xs text-[#8A94A6]">還沒有挑選商品。</p>
      )}
    </div>
  );
}

const HOME_HERO_SPEC = {
  desktop: { width: 1920, height: 1080, ratio: "16:9", aspect: "video" as const, aspectClass: "aspect-video" },
  mobile: { ...PAGE_HERO_SIZE.mobile, aspect: "photo32" as const, aspectClass: "aspect-[3/2]" },
};

/**
 * 內容 tab of the unified home editor: plain fields + the section's own
 * editor (images shown as thumbnails of what is currently uploaded).
 */
export function HomeBlockContentEditor({
  block,
  onChange,
  readOnly,
}: {
  block: CmsBlock;
  onChange: Patch;
  readOnly?: boolean;
}) {
  const key = homeBlockKey(block);
  const s = block.settings;
  const cfg = cfgOf(block);
  const title = typeof s.title === "string" ? s.title : block.name;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const common = (
    <>
      <Field label="標題（顯示在網站上）">
        <Input
          value={title}
          disabled={readOnly}
          onChange={(e) => onChange({ name: e.target.value, settings: { ...s, title: e.target.value } })}
        />
      </Field>
      {key !== "custom_banner" && key !== "hero" ? (
        <Field label="副標（選填）">
          <Input value={str(s.subtitle)} disabled={readOnly} onChange={(e) => setSettings(block, onChange, { subtitle: e.target.value || null })} />
        </Field>
      ) : null}
    </>
  );

  const viewAll = (
    <div className="space-y-1">
      <span className="text-xs font-medium text-[#153E73]">「查看全部」連到（選填）</span>
      <LinkInput value={str(s.view_all_url)} onChange={(href) => setSettings(block, onChange, { view_all_url: href || null })} />
    </div>
  );

  const body = (() => {
    switch (key) {
      case "hero":
        return (
          <div className="space-y-2">
            <p className="rounded-lg bg-[#FFF5CC] px-2.5 py-2 text-[11px] leading-relaxed text-[#153E73]">
              首頁大圖在這裡直接上傳、排序，儲存後立即生效（不需要按發布）。電腦版 1920×1080（16:9），手機版可另外上傳 1080×720（3:2）。
            </p>
            <BannerSlotManager
              compact
              placement={DESKTOP_HOME_HERO_PLACEMENT}
              label="首頁主視覺"
              desktop={HOME_HERO_SPEC.desktop}
              mobile={HOME_HERO_SPEC.mobile}
              uploadFolder="banners/home-hero"
            />
          </div>
        );
      case "latest_campaigns":
        return (
          <>
            {viewAll}
            <LatestCampaignEditor
              value={parseLatestCampaignSettings(cfg)}
              onChange={(next) => setConfig(block, onChange, { ...next })}
            />
          </>
        );
      case "quick_entry":
        return (
          <QuickServicesEditor
            value={parseQuickServicesSettings(cfg)}
            onChange={(next) => setConfig(block, onChange, { ...next })}
          />
        );
      case "latest_recipes":
        return (
          <>
            {viewAll}
            <RecipePickerEditor
              manualIds={Array.isArray(s.manual_ids) ? (s.manual_ids as string[]) : []}
              sourceMode={s.source_mode === "manual" ? "manual" : "auto"}
              onManualIdsChange={(ids) => setSettings(block, onChange, { manual_ids: ids })}
              onSourceModeChange={(mode) => setSettings(block, onChange, { source_mode: mode })}
            />
          </>
        );
      case "service_shortcuts":
        return (
          <ServiceShortcutsEditor
            items={parseServiceShortcuts(cfg)}
            onChange={(items) => setConfig(block, onChange, { items })}
          />
        );
      case "group_buy_banner":
        return (
          <GroupBuyBannerPanel
            value={parseGroupBuyBannerSettings(cfg)}
            onChange={(next) => setConfig(block, onChange, { ...next })}
          />
        );
      case "ingredient_shop":
        return viewAll;
      case "custom_banner":
        return (
          <>
            <AdminImageUpload
              label={`電腦版圖片（${PAGE_HERO_SIZE.desktop.width}×${PAGE_HERO_SIZE.desktop.height}）`}
              images={str(cfg.image_url) ? [str(cfg.image_url)] : []}
              onChange={(imgs) => setConfig(block, onChange, { image_url: imgs[0] ?? "" })}
              uploadFolder="cms/home/banner"
              multiple={false}
              aspectRatio="banner31"
            />
            <AdminImageUpload
              label={`手機版圖片（選填，${PAGE_HERO_SIZE.mobile.width}×${PAGE_HERO_SIZE.mobile.height}）`}
              images={str(cfg.mobile_image_url) ? [str(cfg.mobile_image_url)] : []}
              onChange={(imgs) => setConfig(block, onChange, { mobile_image_url: imgs[0] ?? "" })}
              uploadFolder="cms/home/banner/mobile"
              multiple={false}
              aspectRatio="photo32"
            />
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">點擊後連到（選填）</span>
              <LinkInput value={str(cfg.link_url)} onChange={(href) => setConfig(block, onChange, { link_url: href })} />
            </div>
          </>
        );
      case "custom_products":
        return (
          <>
            {viewAll}
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">挑選商品</span>
              <ProductPicker
                ids={Array.isArray(s.manual_ids) ? (s.manual_ids as string[]) : []}
                onChange={(ids) => setSettings(block, onChange, { manual_ids: ids, source_mode: "manual" })}
              />
            </div>
          </>
        );
      case "custom_text":
        return (
          <>
            <Field label="說明文字">
              <textarea
                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={str(cfg.body)}
                disabled={readOnly}
                onChange={(e) => setConfig(block, onChange, { body: e.target.value })}
              />
            </Field>
            <AdminImageUpload
              label="圖片（選填，建議 1200×800）"
              images={str(cfg.image_url) ? [str(cfg.image_url)] : []}
              onChange={(imgs) => setConfig(block, onChange, { image_url: imgs[0] ?? "" })}
              uploadFolder="cms/home/text"
              multiple={false}
              aspectRatio="photo32"
            />
            <Field label="按鈕文字（選填）">
              <Input value={str(cfg.button_text)} disabled={readOnly} onChange={(e) => setConfig(block, onChange, { button_text: e.target.value })} />
            </Field>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">按鈕連到</span>
              <LinkInput value={str(cfg.link_url)} onChange={(href) => setConfig(block, onChange, { link_url: href })} />
            </div>
          </>
        );
      default:
        return (
          <p className="rounded-lg bg-[#F7F8FA] px-2.5 py-2 text-[11px] text-[#687386]">
            這個區塊的內容由系統自動產生（例如團購、直播），這裡只能調整標題與顯示筆數。
          </p>
        );
    }
  })();

  return (
    <div className={readOnly ? "pointer-events-none space-y-3 opacity-60" : "space-y-3"}>
      {common}
      {body}
    </div>
  );
}

/** First image URL of a block (for thumbnails in the block list). */
export function homeBlockThumbnail(block: CmsBlock): string | null {
  const cfg = cfgOf(block);
  const direct = [cfg.image_url, cfg.mobile_image_url, block.settings.image_url].find(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  if (direct) return direct;
  const lists = [cfg.items, cfg.slides, cfg.banners, cfg.cards];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const rec = (item ?? {}) as Record<string, unknown>;
      const url = [rec.imageUrl, rec.image_url, rec.image, rec.desktopImageUrl].find(
        (v): v is string => typeof v === "string" && v.length > 0
      );
      if (url) return url;
    }
  }
  return null;
}
