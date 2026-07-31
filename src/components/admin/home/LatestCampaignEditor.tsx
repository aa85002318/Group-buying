"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CmsImageField, CMS_IMAGE_SPECS } from "@/components/admin/home/CmsImageField";
import {
  CmsLinkPicker,
  cmsLinkFromHref,
  hrefFromCmsLink,
} from "@/components/admin/home/CmsLinkPicker";
import {
  DEFAULT_LATEST_CAMPAIGN_SETTINGS,
  type HomeLatestCampaignSettings,
  type LatestCampaignSlide,
} from "@/types/home-latest-campaign";

export function LatestCampaignEditor({
  value,
  onChange,
  onSave,
  saving,
}: {
  value: HomeLatestCampaignSettings;
  onChange: (next: HomeLatestCampaignSettings) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const settings = value ?? DEFAULT_LATEST_CAMPAIGN_SETTINGS;

  const updateSlide = (index: number, patch: Partial<LatestCampaignSlide>) => {
    const slides = [...settings.slides];
    slides[index] = { ...slides[index], ...patch };
    onChange({ ...settings, slides });
  };

  const addSlide = () => {
    const id = `campaign-${Date.now()}`;
    onChange({
      ...settings,
      slides: [
        ...settings.slides,
        {
          id,
          title: "新活動",
          imageUrl: "",
          href: "/group-buy",
          enabled: true,
          sortOrder: (settings.slides.length + 1) * 10,
        },
      ],
    });
  };

  const removeSlide = (index: number) => {
    onChange({
      ...settings,
      slides: settings.slides.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">
        最新活動輪播 — 建議橫圖 1200×600（2:1）。連結請用下方選擇器搜尋文章／商品／站內頁，勿手動複製內部網址。
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
          />
          啟用區塊
        </label>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">自動播放毫秒（0＝關）</label>
          <Input
            type="number"
            value={settings.autoPlayMs}
            onChange={(e) =>
              onChange({ ...settings, autoPlayMs: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">區塊標題</label>
          <Input
            value={settings.title}
            onChange={(e) => onChange({ ...settings, title: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">查看更多文字</label>
          <Input
            value={settings.viewAllLabel}
            onChange={(e) => onChange({ ...settings, viewAllLabel: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">查看更多連結</label>
          <Input
            value={settings.viewAllHref}
            onChange={(e) => onChange({ ...settings, viewAllHref: e.target.value })}
            placeholder="/group-buy 或 /articles/xxx 或 /products/xxx"
          />
        </div>
      </div>

      <div className="space-y-3">
        {settings.slides.map((slide, index) => (
          <div key={slide.id} className="space-y-2 rounded-lg border border-border/70 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-coffee">活動 {index + 1}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeSlide(index)}
                aria-label="刪除"
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
            <Input
              value={slide.title}
              onChange={(e) => updateSlide(index, { title: e.target.value })}
              placeholder="活動名稱"
            />
            <CmsLinkPicker
              value={cmsLinkFromHref(slide.href)}
              onChange={(link) => updateSlide(index, { href: hrefFromCmsLink(link) })}
            />
            <CmsImageField
              spec={CMS_IMAGE_SPECS.campaignWide}
              value={slide.imageUrl}
              onChange={(url) => updateSlide(index, { imageUrl: url ?? "" })}
              uploadFolder="home/latest-campaigns"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={slide.enabled !== false}
                onChange={(e) => updateSlide(index, { enabled: e.target.checked })}
              />
              顯示此張
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addSlide}>
          <Plus className="mr-1 h-4 w-4" />
          新增活動圖
        </Button>
        <Button type="button" size="sm" disabled={saving} onClick={onSave}>
          儲存最新活動
        </Button>
      </div>
    </div>
  );
}
