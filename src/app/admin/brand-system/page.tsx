import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const LINKS = [
  { href: "/admin/brand-system/overview", label: "系統總覽", desc: "Brand Experience 狀態與指引" },
  { href: "/admin/brand-system/heroes", label: "Brand Hero", desc: "各頁主視覺內容管理" },
  { href: "/admin/brand-system/navigation", label: "導覽管理", desc: "Header／Drawer／Bottom Nav" },
  { href: "/admin/brand-system/home-layout", label: "首頁版面", desc: "區塊排序／開關／標題" },
  { href: "/admin/home", label: "首頁 CMS", desc: "既有首頁區塊內容與發布" },
  { href: "/admin/brand-system/content-sections", label: "內容區塊", desc: "Brand Section 標題與連結" },
  { href: "/admin/settings/branding", label: "品牌設定", desc: "Logo／色票／分享圖" },
  { href: "/admin/brand-system/assets", label: "素材中心", desc: "Logo／IP／Hero 圖資" },
  { href: "/admin/brand-system/versions", label: "版本紀錄", desc: "發布與還原紀錄" },
];

export default function AdminBrandSystemPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="品牌體驗系統"
        description="全站共用 Design Token 與品牌元件；後台只改內容，不改樣式幾何。"
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl border border-border bg-white p-4 shadow-card transition hover:bg-surface-soft"
            >
              <p className="font-semibold text-coffee">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
