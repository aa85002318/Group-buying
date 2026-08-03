"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { CmsLinkPicker, type CmsLinkValue } from "@/components/admin/home/CmsLinkPicker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SHOP_INFO_BANNERS,
  type ShopInfoBanner,
  type ShopInfoBannerSlot,
} from "@/lib/shop/info-banners";
import { cn } from "@/lib/utils";

function linkFromBanner(b: ShopInfoBanner): CmsLinkValue {
  const href = b.link_url || "";
  if (!href) return { type: "none", href: "" };
  if (/^https?:\/\//i.test(href)) return { type: "custom", href };
  if (href.startsWith("/articles/") || href.startsWith("/news/")) {
    return { type: "article", href };
  }
  return { type: "internal", href };
}

function BannerEditor({
  slot,
  banner,
  onSaved,
}: {
  slot: ShopInfoBannerSlot;
  banner: ShopInfoBanner;
  onSaved: (b: ShopInfoBanner) => void;
}) {
  const [title, setTitle] = useState(banner.title);
  const [imageUrl, setImageUrl] = useState(banner.image_url);
  const [link, setLink] = useState<CmsLinkValue>(linkFromBanner(banner));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(banner.title);
    setImageUrl(banner.image_url);
    setLink(linkFromBanner(banner));
  }, [banner]);

  const save = async () => {
    if (!imageUrl.trim()) {
      alert("請上傳 5:2 圖片");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shop/info-banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot,
          title: title.trim(),
          image_url: imageUrl.trim(),
          mobile_image_url: imageUrl.trim(),
          link_url: link.href || "/",
          link_type: link.type === "custom" ? "external" : link.type === "article" ? "article" : "page",
          alt_text: title.trim(),
          is_active: true,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      onSaved(d.banner);
      alert("已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const label = slot === "order_guide" ? "商品訂購須知" : "企業訂購詢問";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
      <h2 className="text-base font-bold text-coffee">{label}</h2>
      <AdminImageUpload
        label="5:2 Banner 圖"
        images={imageUrl ? [imageUrl] : []}
        onChange={(images) => setImageUrl(images[0] ?? "")}
        uploadFolder="shop/info-banners"
        maxImages={1}
        multiple={false}
      />
      <Input
        placeholder="標題（後台辨識／無障礙）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div>
        <p className="mb-2 text-sm text-muted-foreground">連結（文章／選單頁／站內／外連）</p>
        <CmsLinkPicker value={link} onChange={setLink} />
      </div>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="aspect-[5/2] w-full rounded-2xl object-cover" />
      ) : null}
      <Button onClick={save} disabled={saving}>
        {saving ? "儲存中…" : "儲存此 Banner"}
      </Button>
    </div>
  );
}

export default function AdminShopInfoBannersPage() {
  const [orderGuide, setOrderGuide] = useState(DEFAULT_SHOP_INFO_BANNERS.order_guide);
  const [corporate, setCorporate] = useState(DEFAULT_SHOP_INFO_BANNERS.corporate);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/shop/info-banners")
      .then((r) => r.json())
      .then((d) => {
        if (d.order_guide) setOrderGuide(d.order_guide);
        if (d.corporate) setCorporate(d.corporate);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="訂購須知／企業詢問 Banner"
        description="兩張 5:2 banner：可更換圖片，並設定連結至文章、選單頁或站內路徑。"
        actions={
          <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            返回商城 CMS
          </Link>
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <BannerEditor
            slot="order_guide"
            banner={orderGuide}
            onSaved={setOrderGuide}
          />
          <BannerEditor
            slot="corporate"
            banner={corporate}
            onSaved={setCorporate}
          />
        </div>
      )}
    </div>
  );
}
