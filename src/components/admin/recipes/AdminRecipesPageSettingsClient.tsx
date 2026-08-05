"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsImageField, type CmsImageSpec } from "@/components/admin/home/CmsImageField";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/lib/site-links";
import {
  DEFAULT_RECIPE_PAGE_SETTINGS,
  type RecipeHeroLinkType,
  type RecipePageSettings,
} from "@/lib/recipes/page-settings";
import { cn } from "@/lib/utils";

type RecipeOption = { id: string; title: string; slug?: string | null };
type ArticleOption = { id: string; title: string; slug?: string | null };
type ProductOption = { id: string; name: string; slug?: string | null };

const HERO_DESKTOP_SPEC: CmsImageSpec = {
  label: "Hero Banner 桌面版",
  width: 1500,
  height: 664,
  ratioLabel: "1500×664",
  maxKb: 2048,
  formats: "WebP／JPG／PNG",
};

const HERO_MOBILE_SPEC: CmsImageSpec = {
  label: "Hero Banner 手機版",
  width: 885,
  height: 392,
  ratioLabel: "885×392",
  maxKb: 2048,
  formats: "WebP／JPG／PNG",
};

const LINK_TYPE_OPTIONS: Array<{ value: RecipeHeroLinkType; label: string }> = [
  { value: "none", label: "不設定" },
  { value: "internal", label: "站內頁面" },
  { value: "recipe", label: "食譜" },
  { value: "article", label: "烘焙文章" },
  { value: "product", label: "商品" },
  { value: "external", label: "自訂網址" },
];

function ensureAlt(value: string) {
  return value.trim() || "CHIMEIDIY 烘焙圖書館";
}

export function AdminRecipesPageSettingsClient() {
  const [settings, setSettings] = useState<RecipePageSettings>(DEFAULT_RECIPE_PAGE_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState<RecipePageSettings>(DEFAULT_RECIPE_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [savedSnapshot, settings]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [settingsRes, recipesRes, articlesRes, productsRes] = await Promise.all([
          fetch("/api/admin/recipes/page-settings"),
          fetch("/api/recipes"),
          fetch("/api/articles"),
          fetch("/api/products?scope=baking"),
        ]);

        const [settingsJson, recipesJson, articlesJson, productsJson] = await Promise.all([
          settingsRes.json().catch(() => ({})),
          recipesRes.json().catch(() => ({})),
          articlesRes.json().catch(() => ({})),
          productsRes.json().catch(() => ({})),
        ]);

        if (!settingsRes.ok) {
          throw new Error(settingsJson.error ?? "載入食譜頁設定失敗");
        }
        if (cancelled) return;

        const nextSettings = (settingsJson.settings ?? DEFAULT_RECIPE_PAGE_SETTINGS) as RecipePageSettings;
        setSettings(nextSettings);
        setSavedSnapshot(nextSettings);
        setRecipes((recipesJson.recipes ?? []) as RecipeOption[]);
        setArticles((articlesJson.articles ?? []) as ArticleOption[]);
        setProducts((productsJson.products ?? []) as ProductOption[]);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "載入失敗");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hero = settings.hero;

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/recipes/page-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...settings,
            hero: {
              ...hero,
              alt_text: ensureAlt(hero.alt_text),
              link_value: hero.link_value?.trim() || null,
            },
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "儲存失敗");
      const next = (json.settings ?? settings) as RecipePageSettings;
      setSettings(next);
      setSavedSnapshot(next);
      setMessage(json.message ?? "已更新");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const setHero = (patch: Partial<RecipePageSettings["hero"]>) => {
    setSettings((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        ...patch,
      },
    }));
    setMessage(null);
    setError(null);
  };

  const recipeOptions = recipes.filter((item) => item.slug);
  const articleOptions = articles.filter((item) => item.slug);
  const productOptions = products.filter((item) => item.slug);

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)]">載入食譜頁設定中…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="食譜頁設定"
        description="管理 /recipes Hero Banner 的圖片、連結與排程。其餘食譜首頁版面會沿用這組設定。"
        actions={
          <>
            <Link
              href="/admin/recipes"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              返回食譜管理
            </Link>
            <Button
              size="sm"
              variant="outline"
              disabled={!dirty || saving}
              onClick={() => {
                setSettings(savedSnapshot);
                setMessage(null);
                setError(null);
              }}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
              disabled={saving}
              onClick={() => void save()}
            >
              <Save className="mr-1 h-3.5 w-3.5" />
              {saving ? "儲存中…" : "儲存"}
            </Button>
          </>
        }
      />

      <div className="rounded-[24px] border border-[var(--admin-border)] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.05)]">
        <p className="text-sm font-semibold text-[var(--admin-title)]">Hero Banner</p>
        <p className="mt-1 text-xs leading-6 text-[var(--admin-muted)]">
          桌面版：1500 × 600 px，手機版：885 × 917 px，格式：WebP／JPG／PNG，檔案上限：2MB。未設定連結時前台會維持不可點擊。
        </p>

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <CmsImageField
            deviceLabel="桌面版"
            spec={HERO_DESKTOP_SPEC}
            value={hero.desktop_image_url}
            onChange={(url) => setHero({ desktop_image_url: url })}
            alt={hero.alt_text}
            onAltChange={(alt) => setHero({ alt_text: alt })}
            uploadFolder="brand/heroes/recipes/desktop"
            enforceMaxKb
          />
          <CmsImageField
            deviceLabel="手機版"
            spec={HERO_MOBILE_SPEC}
            value={hero.mobile_image_url}
            onChange={(url) => setHero({ mobile_image_url: url })}
            uploadFolder="brand/heroes/recipes/mobile"
            enforceMaxKb
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">Hero 標題</span>
            <Input
              value={hero.title}
              onChange={(e) => setHero({ title: e.target.value })}
              placeholder="例如：烘焙圖書館主視覺"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">圖片替代文字 Alt</span>
            <Input
              value={hero.alt_text}
              onChange={(e) => setHero({ alt_text: e.target.value })}
              placeholder="CHIMEIDIY 烘焙圖書館"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">指定連結類型</span>
            <select
              className="h-12 w-full rounded-[16px] border border-[var(--admin-border)] bg-white px-3 text-sm text-[var(--admin-title)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35"
              value={hero.link_type}
              onChange={(e) =>
                setHero({
                  link_type: e.target.value as RecipeHeroLinkType,
                  link_value: e.target.value === "none" ? null : hero.link_value,
                })
              }
            >
              {LINK_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">開啟方式</span>
            <select
              className="h-12 w-full rounded-[16px] border border-[var(--admin-border)] bg-white px-3 text-sm text-[var(--admin-title)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35"
              value={hero.open_in_new_tab ? "blank" : "self"}
              onChange={(e) => setHero({ open_in_new_tab: e.target.value === "blank" })}
            >
              <option value="self">目前頁面</option>
              <option value="blank">新分頁</option>
            </select>
          </label>

          {hero.link_type === "internal" ? (
            <label className="text-sm md:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">指定連結</span>
              <Input
                value={hero.link_value ?? ""}
                onChange={(e) => setHero({ link_value: e.target.value })}
                placeholder="例如：/shop 或 /group-buy"
              />
            </label>
          ) : null}

          {hero.link_type === "recipe" ? (
            <label className="text-sm md:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">指定食譜</span>
              <select
                className="h-12 w-full rounded-[16px] border border-[var(--admin-border)] bg-white px-3 text-sm text-[var(--admin-title)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35"
                value={hero.link_value ?? ""}
                onChange={(e) => setHero({ link_value: e.target.value || null })}
              >
                <option value="">請選擇食譜</option>
                {recipeOptions.map((item) => (
                  <option key={item.id} value={item.slug ?? ""}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {hero.link_type === "article" ? (
            <label className="text-sm md:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">指定文章</span>
              <select
                className="h-12 w-full rounded-[16px] border border-[var(--admin-border)] bg-white px-3 text-sm text-[var(--admin-title)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35"
                value={hero.link_value ?? ""}
                onChange={(e) => setHero({ link_value: e.target.value || null })}
              >
                <option value="">請選擇文章</option>
                {articleOptions.map((item) => (
                  <option key={item.id} value={item.slug ?? ""}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {hero.link_type === "product" ? (
            <label className="text-sm md:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">指定商品</span>
              <select
                className="h-12 w-full rounded-[16px] border border-[var(--admin-border)] bg-white px-3 text-sm text-[var(--admin-title)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35"
                value={hero.link_value ?? ""}
                onChange={(e) => setHero({ link_value: e.target.value || null })}
              >
                <option value="">請選擇商品</option>
                {productOptions.map((item) => (
                  <option key={item.id} value={item.slug ?? ""}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {hero.link_type === "external" ? (
            <label className="text-sm md:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">自訂網址</span>
              <Input
                value={hero.link_value ?? ""}
                onChange={(e) => setHero({ link_value: e.target.value })}
                placeholder="https://example.com"
              />
            </label>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hero.is_active}
              onChange={(e) => setHero({ is_active: e.target.checked })}
            />
            顯示狀態：顯示
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">開始時間</span>
            <Input
              type="datetime-local"
              value={hero.start_at ? hero.start_at.slice(0, 16) : ""}
              onChange={(e) => setHero({ start_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block text-xs text-[var(--admin-muted)]">結束時間</span>
            <Input
              type="datetime-local"
              value={hero.end_at ? hero.end_at.slice(0, 16) : ""}
              onChange={(e) => setHero({ end_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] p-4 text-sm text-[var(--admin-text)]">
          <p className="font-semibold text-[var(--admin-title)]">前台行為</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-6 text-[var(--admin-muted)]">
            <li>未設定連結時不會輸出可點擊連結。</li>
            <li>只有外部網址建議開新分頁；站內頁面會保留原站體驗。</li>
            <li>登入頁回跳會使用 `{APP_ROUTES.login}?next=/recipes`。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
