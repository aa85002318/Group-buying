"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SectionRow = {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  more_label: string | null;
  more_href: string | null;
  mobile_visible: boolean;
  desktop_visible: boolean;
  sort_order: number;
  enabled: boolean;
};

export default function AdminBrandHomeLayoutPage() {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/brand-system/home-layout")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setSections(d.sections ?? []);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= sections.length) return;
    const copy = [...sections];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    setSections(
      copy.map((s, i) => ({
        ...s,
        sort_order: (i + 1) * 10,
      }))
    );
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brand-system/home-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setMessage("已儲存區塊設定");
      setSections(d.sections ?? sections);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="首頁版面"
        description="管理 Brand Section 標題、開關與排序。實際首頁區塊內容仍由首頁 CMS 提供。"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/home" className={buttonVariants({ size: "sm", variant: "outline" })}>
              首頁 CMS
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
        <ul className="space-y-3">
          {sections.map((s, index) => (
            <li
              key={s.id}
              className={cn(
                "rounded-xl border border-border bg-white p-4 shadow-card",
                !s.enabled && "opacity-60"
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">{s.section_key}</span>
                <label className="ml-auto flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => {
                      const copy = [...sections];
                      copy[index] = { ...s, enabled: e.target.checked };
                      setSections(copy);
                    }}
                  />
                  啟用
                </label>
                <Button size="sm" variant="outline" onClick={() => move(index, -1)}>
                  上移
                </Button>
                <Button size="sm" variant="outline" onClick={() => move(index, 1)}>
                  下移
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={s.title ?? ""}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[index] = { ...s, title: e.target.value };
                    setSections(copy);
                  }}
                  placeholder="標題"
                />
                <Input
                  value={s.subtitle ?? ""}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[index] = { ...s, subtitle: e.target.value };
                    setSections(copy);
                  }}
                  placeholder="副標題"
                />
                <Input
                  value={s.more_label ?? ""}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[index] = { ...s, more_label: e.target.value };
                    setSections(copy);
                  }}
                  placeholder="查看更多文字"
                />
                <Input
                  value={s.more_href ?? ""}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[index] = { ...s, more_href: e.target.value };
                    setSections(copy);
                  }}
                  placeholder="查看更多連結"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button disabled={saving || loading} onClick={() => void save()}>
        儲存版面
      </Button>
    </div>
  );
}
