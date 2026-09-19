import Link from "next/link";
import {
  ChevronRight,
  FileStack,
  FileUp,
  History,
  ImageUp,
  LayoutTemplate,
  Tags,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const TOOLS = [
  {
    href: "/admin/products/content-templates",
    title: "商品內容公版",
    description: "建立商品介紹、規格等共用範本，編輯商品時可直接套用。",
    icon: LayoutTemplate,
  },
  {
    href: "/admin/products/content-batch",
    title: "內容批次編輯",
    description: "一次整理多個商品的名稱、特色、適合用途與規格。",
    icon: FileStack,
  },
  {
    href: "/admin/products/price-batch",
    title: "價格批次更改",
    description: "一次調整多個商品的售價，可用固定金額或百分比加減。",
    icon: Tags,
  },
  {
    href: "/admin/products/images/batch",
    title: "圖片批次上傳",
    description: "先上傳、再配對，確認後才寫入商品；檔名建議 SKU_01.jpg。",
    icon: ImageUp,
  },
  {
    href: "/admin/product-imports",
    title: "批次匯入",
    description: "用 Excel／CSV 依 SKU 新增或更新大量商品。",
    icon: FileUp,
  },
  {
    href: "/admin/products/batch-history",
    title: "批次操作紀錄",
    description: "查看批次修改與圖片作業，必要時可復原。",
    icon: History,
  },
] as const;

export default function AdminProductToolsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="批次工具"
        description="一次處理大量商品時使用。單一商品請到「商品總覽」直接編輯。"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-[#E7EAF0] bg-white p-5 transition hover:border-[#FEE169] hover:bg-[#FFFDF6]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF5CC] text-[#153E73]">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2 text-[15px] font-bold text-[#153E73]">
                {title}
                <ChevronRight className="h-4 w-4 shrink-0 text-[#8A94A6] transition group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-[#687386]">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
