"use client";

import Link from "next/link";
import {
  BookOpen,
  FileText,
  ImagePlus,
  LayoutTemplate,
  Megaphone,
  Newspaper,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

const WORKSPACE: Array<{ title: string; href: string; Icon: LucideIcon; tone: string }> = [
  { title: "首頁 CMS", href: "/admin/home", Icon: LayoutTemplate, tone: "#FFF5CC" },
  { title: "商城 CMS", href: "/admin/shop", Icon: ShoppingBag, tone: "#EEF8FC" },
  { title: "文章新增", href: "/admin/articles/new", Icon: FileText, tone: "#EFF9EE" },
  { title: "食譜新增", href: "/admin/recipes/new", Icon: BookOpen, tone: "#F3EEFF" },
  { title: "素材庫", href: "/admin/media", Icon: ImagePlus, tone: "#FFF0EE" },
  { title: "共用 Banner", href: "/admin/banners", Icon: Megaphone, tone: "#EEF8FC" },
  { title: "彈跳公告", href: "/admin/content/popups", Icon: Newspaper, tone: "#FFF5CC" },
  { title: "最新資訊", href: "/admin/news", Icon: Newspaper, tone: "#EFF9EE" },
  { title: "說明與法務", href: "/admin/site-pages", Icon: FileText, tone: "#FFF8E1" },
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
          依「我要改什麼頁面／內容」進入。版面請用草稿 → 預覽 → 發布；不含營運報表。
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--admin-title)]">APP 版型與內容</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
          首頁／團購頁／商城版面：先儲存草稿再發布。商城 Banner 等細項素材仍可能儲存即上線，請留意提示。
        </p>
      </section>
    </div>
  );
}
