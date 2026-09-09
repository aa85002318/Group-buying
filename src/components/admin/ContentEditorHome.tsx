"use client";

import Link from "next/link";
import {
  BookOpen,
  FileText,
  ImagePlus,
  LayoutTemplate,
  Megaphone,
  Monitor,
  Newspaper,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

const WORKSPACE: Array<{ title: string; href: string; Icon: LucideIcon; tone: string }> = [
  {
    title: "前台內容編輯器",
    href: "/admin/page-builder",
    Icon: LayoutTemplate,
    tone: "#FFF5CC",
  },
  {
    title: "網頁版設定",
    href: "/admin/page-builder/desktop",
    Icon: Monitor,
    tone: "#EEF8FC",
  },
  {
    title: "手機 App 設定",
    href: "/admin/page-builder/mobile",
    Icon: Smartphone,
    tone: "#EFF9EE",
  },
  { title: "文章新增", href: "/admin/articles/new", Icon: FileText, tone: "#F3EEFF" },
  { title: "食譜新增", href: "/admin/recipes/new", Icon: BookOpen, tone: "#FFF0EE" },
  { title: "素材庫", href: "/admin/media", Icon: ImagePlus, tone: "#FFF8E1" },
  { title: "共用 Banner", href: "/admin/banners", Icon: Megaphone, tone: "#EEF8FC" },
  { title: "彈跳公告", href: "/admin/content/popups", Icon: Newspaper, tone: "#FFF5CC" },
  { title: "說明與法務", href: "/admin/site-pages", Icon: FileText, tone: "#EFF9EE" },
];

function greeting(name?: string | null) {
  const hour = new Date().getHours();
  const hi = hour < 12 ? "早安" : hour < 18 ? "午安" : "晚安";
  return `${hi}，${name?.trim() || "編輯"}`;
}

export function ContentEditorHome({ fullName }: { fullName?: string | null }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-[var(--admin-muted)]">內容工作台</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--admin-title)] md:text-[30px]">
          {greeting(fullName)}
        </h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          網頁版與手機 App 分開設定；商品／食譜等內容共用。流程：草稿 → 預覽 → 發布。
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--admin-title)]">前台 CMS</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {WORKSPACE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-[104px] flex-col justify-between rounded-[24px] p-4 shadow-[0_10px_35px_rgba(0,0,0,.05)]"
              style={{ background: item.tone }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-[var(--admin-title)]">
                <item.Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-[var(--admin-title)]">{item.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#FFE149]/60 bg-[#FFFBEA] px-5 py-4 text-sm text-[#153E73]">
        <p className="font-semibold">發布提醒</p>
        <p className="mt-1 text-[#153E73]/80">
          Desktop 與 Mobile 可分開發布。內容資料共用，不會建立兩套商品／食譜表。
        </p>
      </section>
    </div>
  );
}
