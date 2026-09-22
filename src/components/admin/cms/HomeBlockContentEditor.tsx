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
import { DEFAULT_HOT_SEARCH_KEYWORDS, parseHotSearchKeywords, type HotSearchKeyword } from "@/lib/home/hot-search";
import {
  DEFAULT_INGREDIENT_HINT,
  DEFAULT_SEARCH_PLACEHOLDER,
  listToText,
  parseAiSection,
  parseBrandBreath,
  parseStoreB2b,
  textToList,
} from "@/lib/home/website-home-config";

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

const KEYWORD_TYPES: Array<{ value: NonNullable<HotSearchKeyword["linkType"]>; label: string }> = [
  { value: "product_search", label: "搜尋商品" },
  { value: "recipe_search", label: "搜尋食譜" },
  { value: "custom", label: "自訂連結" },
];

/** 熱門搜尋 chips: label + where it goes. Stored as config.keywords. */
function KeywordEditor({ value, onChange }: { value: HotSearchKeyword[]; onChange: (next: HotSearchKeyword[]) => void }) {
  const update = (i: number, patch: Partial<HotSearchKeyword>) =>
    onChange(value.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((k, i) => (
        <div key={k.id} className="space-y-1.5 rounded-lg border border-[#E9EDF2] p-2">
          <div className="flex items-center gap-1.5">
            <Input value={k.label} placeholder="標籤文字" onChange={(e) => update(i, { label: e.target.value, keyword: e.target.value })} />
            <button type="button" title="上移" onClick={() => move(i, -1)} className="p-1 text-[#687386]"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" title="下移" onClick={() => move(i, 1)} className="p-1 text-[#687386]"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" title="刪除" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="p-1 text-[#B42318]"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex flex-wrap gap-1">
            {KEYWORD_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update(i, { linkType: t.value })}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  (k.linkType ?? "product_search") === t.value ? "bg-[#153E73] text-white" : "bg-[#F2F4F7] text-[#153E73]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {k.linkType === "custom" ? (
            <LinkInput value={k.linkTarget ?? ""} onChange={(href) => update(i, { linkTarget: href })} />
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...value, { id: `kw-${Date.now().toString(36)}`, label: "", keyword: "", linkType: "product_search", enabled: true }])
        }
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[#153E73]/30 py-1.5 text-xs font-semibold text-[#153E73]"
      >
        <Plus className="h-3.5 w-3.5" />
        新增標籤
      </button>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-[#FFF5CC] px-2.5 py-2 text-[11px] leading-relaxed text-[#153E73]">{children}</p>;
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
      case "hot_searches": {
        const kws = parseHotSearchKeywords(cfg);
        const keywords = kws.length ? kws : DEFAULT_HOT_SEARCH_KEYWORDS;
        return (
          <>
            <Field label="搜尋框提示文字">
              <Input
                value={str(cfg.placeholder)}
                placeholder={DEFAULT_SEARCH_PLACEHOLDER}
                disabled={readOnly}
                onChange={(e) => setConfig(block, onChange, { placeholder: e.target.value })}
              />
            </Field>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">熱門搜尋標籤（手機可左右滑）</span>
              <KeywordEditor
                value={keywords}
                onChange={(next) =>
                  setConfig(block, onChange, {
                    keywords: next
                      .filter((k) => k.label.trim())
                      .map((k, i) => ({ ...k, keyword: k.keyword || k.label, sortOrder: (i + 1) * 10 })),
                  })
                }
              />
            </div>
          </>
        );
      }
      case "popular_categories":
        return (
          <>
            {viewAll}
            <Note>
              分類圖片、名稱與順序沿用「商城分類」的設定（勾選「顯示在商城首頁」的分類，最多 7 個，最後自動加上「全部分類」）。
              {" "}
              <a href="/admin/shop/categories" className="font-semibold underline">前往商城分類</a>
            </Note>
          </>
        );
      case "popular_baking_products":
      case "weekly_new_products": {
        const manual = s.source_mode === "manual";
        return (
          <>
            {viewAll}
            <div className="flex gap-1">
              {[
                ["auto", key === "popular_baking_products" ? "自動（商品標記為熱門）" : "自動（商品標記為新品）"],
                ["manual", "自己挑選"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSettings(block, onChange, { source_mode: mode })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    (manual ? "manual" : "auto") === mode ? "bg-[#153E73] text-white" : "bg-[#F2F4F7] text-[#153E73]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {manual ? (
              <ProductPicker
                ids={Array.isArray(s.manual_ids) ? (s.manual_ids as string[]) : []}
                onChange={(ids) => setSettings(block, onChange, { manual_ids: ids })}
              />
            ) : (
              <Note>
                自動顯示在「商品管理」勾選為{key === "popular_baking_products" ? "「熱門」" : "「新品」"}的商品（最多 12 個）。手機左右滑動，電腦一排 5 個。
              </Note>
            )}
          </>
        );
      }
      case "brand_statement": {
        const bb = parseBrandBreath(cfg);
        return (
          <>
            <Note>放在「新品上架」和「精選食譜」之間的過渡區，讓畫面從購物切換到烘焙靈感。標題請寫在上方「標題」欄。</Note>
            <Field label="小字（英文標語）">
              <Input value={bb.eyebrow} disabled={readOnly} onChange={(e) => setConfig(block, onChange, { eyebrow: e.target.value })} />
            </Field>
            <Field label="副標">
              <textarea
                className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bb.body}
                disabled={readOnly}
                onChange={(e) => setConfig(block, onChange, { body: e.target.value })}
              />
            </Field>
            <Field label="按鈕文字">
              <Input value={bb.buttonText} disabled={readOnly} onChange={(e) => setConfig(block, onChange, { button_text: e.target.value })} />
            </Field>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">按鈕連到</span>
              <LinkInput value={bb.href} onChange={(href) => setConfig(block, onChange, { link_url: href })} />
            </div>
            <AdminImageUpload
              label="右側 IP／素材圖（透明底 PNG；未上傳時使用揮手 IP）"
              images={str(cfg.image_url) ? [str(cfg.image_url)] : []}
              onChange={(imgs) => setConfig(block, onChange, { image_url: imgs[0] ?? "" })}
              uploadFolder="cms/home/brand"
              multiple={false}
              aspectRatio="square"
            />
          </>
        );
      }
      case "ai_assistant": {
        const ai = parseAiSection(cfg);
        return (
          <>
            <AdminImageUpload
              label="左側情境大圖（建議 1500×1200；未上傳時使用烘焙情境圖）"
              images={str(cfg.scene_image_url) ? [str(cfg.scene_image_url)] : []}
              onChange={(imgs) => setConfig(block, onChange, { scene_image_url: imgs[0] ?? "" })}
              uploadFolder="cms/home/ai"
              multiple={false}
              aspectRatio="photo32"
            />
            <Field label="引言（粗體一句）">
              <Input value={ai.lead} disabled={readOnly} onChange={(e) => setConfig(block, onChange, { lead: e.target.value })} />
            </Field>
            <Field label="小標籤">
              <Input value={ai.badge} disabled={readOnly} onChange={(e) => setConfig(block, onChange, { badge: e.target.value })} />
            </Field>
            <Field label="說明文字">
              <textarea
                className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={ai.body}
                disabled={readOnly}
                onChange={(e) => setConfig(block, onChange, { body: e.target.value })}
              />
            </Field>
            <Field label="功能標籤（用、分隔）">
              <Input value={listToText(ai.chips)} disabled={readOnly} onChange={(e) => setConfig(block, onChange, { chips: textToList(e.target.value) })} />
            </Field>
            <Field label="按鈕文字">
              <Input value={ai.buttonText} disabled={readOnly} onChange={(e) => setConfig(block, onChange, { button_text: e.target.value })} />
            </Field>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">按鈕連到</span>
              <LinkInput value={ai.href} onChange={(href) => setConfig(block, onChange, { link_url: href })} />
            </div>
            <AdminImageUpload
              label="小 IP 圖（透明底 PNG；未上傳時使用天使 IP）"
              images={str(cfg.image_url) ? [str(cfg.image_url)] : []}
              onChange={(imgs) => setConfig(block, onChange, { image_url: imgs[0] ?? "" })}
              uploadFolder="cms/home/ai"
              multiple={false}
              aspectRatio="square"
            />
          </>
        );
      }
      case "store_information": {
        const sb = parseStoreB2b(cfg);
        const raw = cfg as { store?: Record<string, unknown>; b2b?: Record<string, unknown> };
        const setStore = (patch: Record<string, unknown>) => setConfig(block, onChange, { store: { ...(raw.store ?? {}), ...patch } });
        const setB2b = (patch: Record<string, unknown>) => setConfig(block, onChange, { b2b: { ...(raw.b2b ?? {}), ...patch } });
        return (
          <>
            <p className="text-xs font-bold text-[#153E73]">門市卡片</p>
            <Field label="門市名稱">
              <Input value={sb.store.name} disabled={readOnly} onChange={(e) => setStore({ name: e.target.value })} />
            </Field>
            <Field label="地址">
              <Input value={sb.store.address} disabled={readOnly} onChange={(e) => setStore({ address: e.target.value })} />
            </Field>
            <Field label="標籤（用、分隔）">
              <Input value={listToText(sb.store.tags)} disabled={readOnly} onChange={(e) => setStore({ tags: textToList(e.target.value) })} />
            </Field>
            <Field label="連結文字">
              <Input value={sb.store.linkText} disabled={readOnly} onChange={(e) => setStore({ link_text: e.target.value })} />
            </Field>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">連到</span>
              <LinkInput value={sb.store.href} onChange={(href) => setStore({ link_url: href })} />
            </div>
            <AdminImageUpload
              label="門市照片（建議 1600×1000；未上傳時使用「門市管理」的照片）"
              images={sb.store.imageUrl ? [sb.store.imageUrl] : []}
              onChange={(imgs) => setStore({ image_url: imgs[0] ?? "" })}
              uploadFolder="cms/home/store"
              multiple={false}
              aspectRatio="photo32"
            />
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-bold text-[#153E73]">企業採購卡片</p>
              <label className="flex items-center gap-1 text-xs text-[#153E73]">
                <input type="checkbox" checked={sb.b2b.enabled} onChange={(e) => setB2b({ enabled: e.target.checked })} />
                顯示
              </label>
            </div>
            {sb.b2b.enabled ? (
              <>
                <Field label="標題">
                  <Input value={sb.b2b.title} disabled={readOnly} onChange={(e) => setB2b({ title: e.target.value })} />
                </Field>
                <AdminImageUpload
                  label="卡片圖片（建議 1600×1000；未上傳時使用烘焙器具情境圖）"
                  images={str(raw.b2b?.image_url) ? [str(raw.b2b?.image_url)] : []}
                  onChange={(imgs) => setB2b({ image_url: imgs[0] ?? "" })}
                  uploadFolder="cms/home/b2b"
                  multiple={false}
                  aspectRatio="photo32"
                />
                <Field label="適用對象（用、分隔）">
                  <Input value={listToText(sb.b2b.tags)} disabled={readOnly} onChange={(e) => setB2b({ tags: textToList(e.target.value) })} />
                </Field>
                <Field label="補充說明">
                  <Input value={sb.b2b.note} disabled={readOnly} onChange={(e) => setB2b({ note: e.target.value })} />
                </Field>
                <Field label="按鈕文字">
                  <Input value={sb.b2b.buttonText} disabled={readOnly} onChange={(e) => setB2b({ button_text: e.target.value })} />
                </Field>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-[#153E73]">按鈕連到</span>
                  <LinkInput value={sb.b2b.href} onChange={(href) => setB2b({ link_url: href })} />
                </div>
              </>
            ) : null}
          </>
        );
      }
      case "ingredient_shop":
        return (
          <>
            {viewAll}
            <label className="flex items-center gap-2 text-xs text-[#153E73]">
              <input
                type="checkbox"
                checked={cfg.hint_enabled !== false}
                onChange={(e) => setConfig(block, onChange, { hint_enabled: e.target.checked })}
              />
              放在「精選食譜」下方時顯示提示文字
            </label>
            {cfg.hint_enabled !== false ? (
              <Input
                value={str(cfg.hint_text)}
                placeholder={DEFAULT_INGREDIENT_HINT}
                disabled={readOnly}
                onChange={(e) => setConfig(block, onChange, { hint_text: e.target.value })}
              />
            ) : null}
            <Note>商品依後台設定的材料分類自動挑選；可在下方「自己挑選」模式手動指定。</Note>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">自己挑選商品（選填，挑了就只顯示這些）</span>
              <ProductPicker
                ids={Array.isArray(s.manual_ids) ? (s.manual_ids as string[]) : []}
                onChange={(ids) => setSettings(block, onChange, { manual_ids: ids, source_mode: ids.length ? "manual" : "auto" })}
              />
            </div>
          </>
        );
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
