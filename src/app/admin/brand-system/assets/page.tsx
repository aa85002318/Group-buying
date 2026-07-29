"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";

type AssetRow = {
  id: string;
  name: string;
  asset_type: string;
  file_url: string;
  alt_text: string | null;
  enabled: boolean;
  created_at: string;
};

const CATEGORIES = [
  "Logo",
  "IP 主形象",
  "IP 動作",
  "Hero 背景",
  "分類 Icon",
  "Placeholder",
  "社群圖片",
  "課程素材",
  "團購素材",
];

export default function AdminBrandAssetsPage() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/brand-system/assets")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setAssets(d.assets ?? []);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="素材中心"
        description="IP 規範：深藍圓弧瀏海、金光環、白翅膀、品牌紅上衣、扁平插畫。上傳（WebP／EXIF）下一波接上。"
        actions={
          <Link href="/admin/brand-system" className={buttonVariants({ size: "sm", variant: "outline" })}>
            返回
          </Link>
        }
      />

      {message ? (
        <p className="rounded-lg bg-surface-soft px-3 py-2 text-sm text-coffee">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-coffee"
          >
            {c}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <ul className="space-y-2">
          {assets.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-card"
            >
              <p className="font-semibold text-coffee">
                {a.name}{" "}
                <span className="text-xs font-normal text-muted-foreground">({a.asset_type})</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">{a.file_url}</p>
            </li>
          ))}
          {!assets.length ? (
            <li className="text-sm text-muted-foreground">
              尚無素材。資料表 `brand_assets` 已就緒，請之後上傳至 `brand-assets` bucket。
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
