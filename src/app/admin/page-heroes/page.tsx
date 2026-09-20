"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CmsLinkPicker,
  cmsLinkFromHref,
  hrefFromCmsLink,
} from "@/components/admin/home/CmsLinkPicker";
import {
  PAGE_HERO_PAGES,
  PAGE_HERO_SIZE,
  pageHeroPlacement,
  type PageHeroKey,
} from "@/lib/page-heroes";
import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";
import { cn } from "@/lib/utils";

type Banner = {
  id: string;
  title: string;
  image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  placement: string | null;
  sort_order: number | null;
  is_active: boolean;
};

type Form = {
  id: string | null;
  title: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  is_active: boolean;
};

const EMPTY: Form = { id: null, title: "", image_url: "", mobile_image_url: "", link_url: "", is_active: true };

function PageHeroesAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const pageKey = (params.get("page") as PageHeroKey) || "shop";
  const page = PAGE_HERO_PAGES.find((p) => p.key === pageKey) ?? PAGE_HERO_PAGES[0]!;
  const placement = pageHeroPlacement(page.key);

  const [all, setAll] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/cms?type=banners")
      .then((r) => r.json())
      .then((d) => setAll((d.banners ?? []) as Banner[]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const banners = useMemo(
    () =>
      all
        .filter((b) => b.placement === placement)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [all, placement]
  );
  const countFor = (key: PageHeroKey) =>
    all.filter((b) => b.placement === pageHeroPlacement(key) && b.is_active).length;

  const patch = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "banner", id, ...updates }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error ?? "更新失敗");
  };

  const save = async () => {
    if (!form) return;
    if (!form.image_url) {
      setMessage({ ok: false, text: "請先上傳電腦版圖片" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        kind: "banner",
        title: form.title.trim() || `${page.label} Hero`,
        subtitle: null,
        button_text: null,
        image_url: form.image_url,
        mobile_image_url: form.mobile_image_url || null,
        link_url: form.link_url || null,
        placement,
        banner_type: placement,
        is_active: form.is_active,
        status: form.is_active ? "active" : "inactive",
      };
      if (form.id) {
        await patch(form.id, payload);
      } else {
        const res = await fetch("/api/admin/cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, sort_order: (banners.at(-1)?.sort_order ?? 0) + 10 }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error ?? "新增失敗");
      }
      setForm(null);
      setMessage({ ok: true, text: "已儲存，網站重新整理後即可看到。" });
      load();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "儲存失敗" });
    } finally {
      setBusy(false);
    }
  };

  const reorder = async (from: number, to: number) => {
    if (to < 0 || to >= banners.length) return;
    const next = [...banners];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setBusy(true);
    try {
      await Promise.all(next.map((b, i) => patch(b.id, { sort_order: (i + 1) * 10 })));
      load();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "排序失敗" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (b: Banner) => {
    setBusy(true);
    try {
      await patch(b.id, { is_active: !b.is_active, status: !b.is_active ? "active" : "inactive" });
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b: Banner) => {
    if (!window.confirm("確定刪除這張 Banner？刪除後無法復原。")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("刪除失敗");
      load();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "刪除失敗" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 py-2 md:px-0">
      <AdminPageHeader
        title="各頁 Hero Banner"
        description={`每一頁最上方的大圖。只有圖片和連結，不放文字。所有頁面同一個尺寸：電腦版 ${PAGE_HERO_SIZE.desktop.width}×${PAGE_HERO_SIZE.desktop.height}（${PAGE_HERO_SIZE.desktop.ratio}），手機版可另外上傳 ${PAGE_HERO_SIZE.mobile.width}×${PAGE_HERO_SIZE.mobile.height}（${PAGE_HERO_SIZE.mobile.ratio}）。放多張會自動輪播。`}
      />

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#E7EAF0] bg-white p-1" aria-label="選擇頁面">
        {PAGE_HERO_PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setForm(null);
              setMessage(null);
              router.replace(`/admin/page-heroes?page=${p.key}`);
            }}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition",
              p.key === page.key ? "bg-[#FEE169] text-[#153E73]" : "text-[#687386] hover:bg-[#FFFDF6]"
            )}
          >
            {p.label}
            <span className="ml-1 text-[11px] font-normal opacity-70">{countFor(p.key)}</span>
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#687386]">
          頁面：<span className="font-semibold text-[#153E73]">{page.label}</span>
          <a href={page.path} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-[#79C7E8] hover:underline">
            {page.path}
            <ExternalLink className="h-3 w-3" />
          </a>
          {page.key === "group_buy" && !GROUP_BUY_CONSUMER_VISIBLE ? (
            <span className="ml-2 text-xs text-[#8A94A6]">（團購目前未對外，可先準備）</span>
          ) : null}
        </p>
        <Button type="button" onClick={() => setForm({ ...EMPTY })} disabled={busy}>
          <Plus className="mr-1 h-4 w-4" />
          新增 Banner
        </Button>
      </div>

      {message ? (
        <p className={message.ok ? "rounded-xl bg-[#E8F8EF] px-3 py-2 text-sm text-[#1B6B3A]" : "rounded-xl bg-[#FDE8E6] px-3 py-2 text-sm text-[#B42318]"}>
          {message.text}
        </p>
      ) : null}

      {form ? (
        <section className="space-y-4 rounded-2xl border border-[#FEE169] bg-[#FFFDF6] p-4">
          <h2 className="text-sm font-bold text-[#153E73]">{form.id ? "編輯 Banner" : "新增 Banner"}</h2>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <AdminImageUpload
              label={`電腦版圖片（必填，${PAGE_HERO_SIZE.desktop.width}×${PAGE_HERO_SIZE.desktop.height}）`}
              images={form.image_url ? [form.image_url] : []}
              onChange={(imgs) => setForm({ ...form, image_url: imgs[0] ?? "" })}
              uploadFolder={`banners/page-hero/${page.key}`}
              multiple={false}
              aspectRatio="banner31"
            />
            <AdminImageUpload
              label={`手機版圖片（選填，${PAGE_HERO_SIZE.mobile.width}×${PAGE_HERO_SIZE.mobile.height}；沒上傳就用電腦版）`}
              images={form.mobile_image_url ? [form.mobile_image_url] : []}
              onChange={(imgs) => setForm({ ...form, mobile_image_url: imgs[0] ?? "" })}
              uploadFolder={`banners/page-hero/${page.key}/mobile`}
              multiple={false}
              aspectRatio="photo32"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#153E73]">點擊後連到（選填）</span>
              <CmsLinkPicker
                value={cmsLinkFromHref(form.link_url)}
                onChange={(v) => setForm({ ...form, link_url: hrefFromCmsLink(v) })}
              />
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[#153E73]">內部名稱（選填，不會顯示在網站）</span>
              <Input value={form.title} placeholder={`${page.label} Hero`} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <span className="block text-[11px] text-[#8A94A6]">也會當作圖片的替代文字，給看不到圖片的使用者。</span>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#153E73]">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            在網站顯示
          </label>
          <div className="flex gap-2">
            <Button type="button" onClick={save} disabled={busy}>
              {busy ? "儲存中…" : "儲存"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(null)} disabled={busy}>
              取消
            </Button>
          </div>
        </section>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#8A94A6]">載入中…</p>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-white p-8 text-center text-sm text-[#687386]">
          這一頁還沒有上傳 Banner。
          {page.fallbackImage ? " 目前網站顯示的是預設圖片。" : " 目前網站不會顯示 Hero。"}
        </div>
      ) : (
        <ol className="space-y-3">
          {banners.map((b, i) => (
            <li
              key={b.id}
              className={cn(
                "grid gap-3 rounded-2xl border bg-white p-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] md:items-center",
                b.is_active ? "border-[#E9EDF2]" : "border-dashed border-[#D0D5DD] opacity-60"
              )}
            >
              <div>
                <p className="mb-1 text-[11px] text-[#8A94A6]">電腦版</p>
                <div className="aspect-[3/1] overflow-hidden rounded-lg bg-[#F2F4F7]">
                  {b.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-[#8A94A6]">手機版</p>
                <div className="aspect-[3/2] overflow-hidden rounded-lg bg-[#F2F4F7]">
                  {b.mobile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.mobile_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <p className="flex h-full items-center justify-center px-2 text-center text-[11px] text-[#98A2B3]">
                      未上傳，使用電腦版
                    </p>
                  )}
                </div>
              </div>
              <div className="min-w-0 space-y-1 text-sm">
                <p className="truncate font-semibold text-[#153E73]">{b.title}</p>
                <p className="truncate font-mono text-xs text-[#687386]">{b.link_url || "（沒有連結）"}</p>
                <p className="text-xs text-[#8A94A6]">第 {i + 1} 張・{b.is_active ? "顯示中" : "已隱藏"}</p>
              </div>
              <div className="flex flex-wrap gap-1 md:flex-col">
                <Button type="button" size="sm" variant="outline" title="編輯" disabled={busy}
                  onClick={() => setForm({ id: b.id, title: b.title ?? "", image_url: b.image_url ?? "", mobile_image_url: b.mobile_image_url ?? "", link_url: b.link_url ?? "", is_active: b.is_active })}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="sm" variant="outline" title="上移" disabled={busy || i === 0} onClick={() => reorder(i, i - 1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="sm" variant="outline" title="下移" disabled={busy || i === banners.length - 1} onClick={() => reorder(i, i + 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => toggle(b)}>
                  {b.is_active ? "隱藏" : "顯示"}
                </Button>
                <Button type="button" size="sm" variant="outline" title="刪除" disabled={busy} onClick={() => remove(b)}>
                  <Trash2 className="h-3.5 w-3.5 text-[#B42318]" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function AdminPageHeroesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#8A94A6]">載入中…</p>}>
      <PageHeroesAdmin />
    </Suspense>
  );
}
