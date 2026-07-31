"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CmsImageField, CMS_IMAGE_SPECS } from "@/components/admin/home/CmsImageField";

type HeroRow = {
  id: string;
  hero_key: string;
  title: string;
  subtitle: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  image_alt: string | null;
  search_placeholder: string | null;
  show_title: boolean;
  show_subtitle: boolean;
  enabled: boolean;
};

/**
 * Inline hero editor for /admin/home — uses brand_heroes API.
 */
export function HomeHeroEditor({ saving }: { saving?: boolean }) {
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/brand-system/heroes");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "載入 Hero 失敗");
      const list = (json.heroes ?? []) as HeroRow[];
      const home =
        list.find((h) => h.hero_key === "home") ||
        list.find((h) => h.hero_key === "homepage") ||
        list[0] ||
        null;
      setHero(home);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!hero?.id) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/brand-system/heroes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: hero.id,
          title: hero.title,
          subtitle: hero.subtitle,
          desktop_image_url: hero.desktop_image_url,
          mobile_image_url: hero.mobile_image_url,
          image_alt: hero.image_alt,
          search_placeholder: hero.search_placeholder,
          show_title: hero.show_title,
          show_subtitle: hero.show_subtitle,
          enabled: hero.enabled,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "儲存失敗");
      setMsg("已儲存 Hero Banner");
      if (json.hero) setHero(json.hero as HeroRow);
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">載入 Hero…</p>;
  }
  if (!hero) {
    return (
      <p className="text-sm text-danger">
        {error || "找不到 home Hero，請先至品牌體驗系統建立。"}
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">
        上傳建議：桌機 {CMS_IMAGE_SPECS.heroDesktop.width}×{CMS_IMAGE_SPECS.heroDesktop.height}（5:2）、手機{" "}
        {CMS_IMAGE_SPECS.heroMobile.width}×{CMS_IMAGE_SPECS.heroMobile.height}（6:5），各 500KB 以下。
        缺少手機圖時暫用桌面圖，請盡快補齊。
      </p>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {msg ? <p className="text-xs text-success">{msg}</p> : null}

      <CmsImageField
        deviceLabel="桌面版"
        spec={CMS_IMAGE_SPECS.heroDesktop}
        value={hero.desktop_image_url}
        onChange={(url) => setHero({ ...hero, desktop_image_url: url })}
        alt={hero.image_alt ?? ""}
        onAltChange={(alt) => setHero({ ...hero, image_alt: alt })}
        uploadFolder="brand/heroes/home/desktop"
      />
      <CmsImageField
        deviceLabel="手機版"
        spec={CMS_IMAGE_SPECS.heroMobile}
        value={hero.mobile_image_url}
        onChange={(url) => setHero({ ...hero, mobile_image_url: url })}
        uploadFolder="brand/heroes/home/mobile"
      />
      {!hero.mobile_image_url && hero.desktop_image_url ? (
        <p className="text-[11px] text-amber-700">
          提醒：尚未上傳手機版，前台將暫時使用桌面圖。
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">主標題</label>
          <Input
            value={hero.title}
            onChange={(e) => setHero({ ...hero, title: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">副標題</label>
          <Input
            value={hero.subtitle ?? ""}
            onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">圖片 alt</label>
          <Input
            value={hero.image_alt ?? ""}
            onChange={(e) => setHero({ ...hero, image_alt: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">搜尋框提示文字</label>
          <Input
            value={hero.search_placeholder ?? ""}
            onChange={(e) => setHero({ ...hero, search_placeholder: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hero.show_title}
            onChange={(e) => setHero({ ...hero, show_title: e.target.checked })}
          />
          顯示主標題文字（完整 Banner 圖建議關閉）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hero.show_subtitle}
            onChange={(e) => setHero({ ...hero, show_subtitle: e.target.checked })}
          />
          顯示副標題文字
        </label>
      </div>

      <Button size="sm" disabled={busy || saving} onClick={() => void save()}>
        儲存 Hero Banner
      </Button>
    </div>
  );
}
