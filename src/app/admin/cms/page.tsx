"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Block = {
  id: string;
  block_key: string;
  title: string;
  is_visible: boolean;
  sort_order: number;
};

type Banner = {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
};

type Page = {
  id: string;
  slug: string;
  title: string;
  is_published: boolean;
};

export default function AdminCmsPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [pageForm, setPageForm] = useState({ slug: "", title: "", content: "" });

  const load = () => {
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((d) => {
        setBlocks(d.blocks ?? []);
        setBanners(d.banners ?? []);
        setPages(d.pages ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (block: Block) => {
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "block",
        id: block.id,
        is_visible: !block.is_visible,
      }),
    });
    load();
  };

  const moveBlock = async (block: Block, dir: -1 | 1) => {
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "block",
        id: block.id,
        sort_order: block.sort_order + dir * 10,
      }),
    });
    load();
  };

  const createPage = async () => {
    if (!pageForm.slug || !pageForm.title) return;
    await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "page", ...pageForm, is_published: false }),
    });
    setPageForm({ slug: "", title: "", content: "" });
    load();
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="統一 CMS"
        description="首頁 Banner、區塊排序、頁面、門市公告（與官網／團購共用）"
      />

      <section className="space-y-3">
        <h2 className="text-lg font-black text-[#1E3A8A]">首頁區塊排序</h2>
        <div className="space-y-2">
          {blocks.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E8EBF4] bg-white px-4 py-3"
            >
              <span className="min-w-[140px] font-medium">{b.title}</span>
              <span className="text-xs text-[#64748B]">{b.block_key}</span>
              <span className="text-xs text-[#64748B]">order {b.sort_order}</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void moveBlock(b, -1)}>
                  ↑
                </Button>
                <Button size="sm" variant="outline" onClick={() => void moveBlock(b, 1)}>
                  ↓
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void toggleBlock(b)}>
                  {b.is_visible ? "隱藏" : "顯示"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-[#1E3A8A]">Banner（{banners.length}）</h2>
        <p className="text-sm text-[#64748B]">
          使用 cms_banners；可於既有推播／行銷流程維護，或透過 API 新增。
        </p>
        <ul className="space-y-2">
          {banners.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-[#E8EBF4] bg-white px-4 py-3 text-sm"
            >
              {b.title} {b.is_active ? "" : "(停用)"}
            </li>
          ))}
          {!banners.length && <li className="text-sm text-[#64748B]">尚無 Banner</li>}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-[#1E3A8A]">CMS 頁面</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="slug"
            value={pageForm.slug}
            onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
          />
          <Input
            placeholder="標題"
            value={pageForm.title}
            onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
          />
          <Button onClick={() => void createPage()}>新增草稿</Button>
        </div>
        <ul className="space-y-2">
          {pages.map((p) => (
            <li key={p.id} className="rounded-xl border border-[#E8EBF4] bg-white px-4 py-3 text-sm">
              /{p.slug} — {p.title} {p.is_published ? "✓ 已發布" : "草稿"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
