"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";

type VersionRow = {
  id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  created_at: string;
  created_by: string | null;
};

export default function AdminBrandVersionsPage() {
  const [rows, setRows] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/brand-system/versions")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setRows(d.versions ?? []);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="版本紀錄"
        description="發布／更新寫入 brand_versions。預覽尺寸：390／768／1440。"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/home/preview" className={buttonVariants({ size: "sm", variant: "outline" })}>
              首頁預覽
            </Link>
            <Link href="/admin/brand-system" className={buttonVariants({ size: "sm", variant: "outline" })}>
              返回
            </Link>
          </div>
        }
      />

      {message ? (
        <p className="rounded-lg bg-surface-soft px-3 py-2 text-sm text-coffee">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((v) => (
            <li
              key={v.id}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-card"
            >
              <p className="font-semibold text-coffee">
                {v.resource_type} · {v.action}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(v.created_at).toLocaleString("zh-TW")} · {v.resource_id}
              </p>
            </li>
          ))}
          {!rows.length ? (
            <li className="text-sm text-muted-foreground">尚無版本紀錄</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
