"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImportPreview } from "@/components/admin/store/AdminImportPreview";
import { Button } from "@/components/ui/button";
import {
  STORE_EXCEL_EXPORTS,
  STORE_EXCEL_TEMPLATES,
  type StoreExcelImportType,
} from "@/lib/admin/store-excel";
import { cn } from "@/lib/utils";

export default function StoreExcelHubPage() {
  const [activeImport, setActiveImport] = useState<StoreExcelImportType>("expiry");

  const activeTemplate = useMemo(
    () => STORE_EXCEL_TEMPLATES.find((t) => t.id === activeImport),
    [activeImport]
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Excel 匯入匯出"
        description="全部中文欄位。商品主檔仍共用 products；此處匯入效期／庫存／價格／異常／報廢／退貨。"
        actions={
          <Link href="/admin/store/batches">
            <Button type="button" variant="outline">
              批次管理
            </Button>
          </Link>
        }
      />

      <section id="import" className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-[#6F4E37]" />
          <h2 className="text-lg font-semibold text-[#2F2925]">下載範本與匯入</h2>
        </div>
        <p className="text-sm text-[#756B64]">
          先下載中文範本填寫，再上傳預覽確認。找不到商品的列不會新建商品（商品匯入除外）。
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORE_EXCEL_TEMPLATES.map((tpl) => {
            const selected = activeImport === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setActiveImport(tpl.id)}
                className={cn(
                  "rounded-[16px] border p-4 text-left transition",
                  selected
                    ? "border-[#FFE149] bg-[#FFF5C7]"
                    : "border-[#E9DED4] bg-white hover:bg-[#FFFBEA]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[#2F2925]">{tpl.label}</p>
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#6F4E37]" />
                </div>
                <p className="mt-1 text-sm text-[#756B64]">{tpl.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`/api/admin/store/import?type=${tpl.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#6F4E37] underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    下載範本
                  </a>
                  {tpl.externalHref ? (
                    <Link
                      href={tpl.externalHref}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-primary underline"
                    >
                      前往商品匯入
                    </Link>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {activeTemplate?.supportsStoreImport ? (
          <div className="space-y-2">
            <h3 className="font-medium text-[#2F2925]">
              匯入：{activeTemplate.label}
            </h3>
            <p className="text-sm text-[#756B64]">
              欄位：{activeTemplate.headers.join("、")}
            </p>
            <AdminImportPreview importType={activeImport} />
          </div>
        ) : activeTemplate ? (
          <div className="rounded-[16px] border border-[#E9DED4] bg-[#FFF8F5] p-4 text-sm text-[#756B64]">
            「{activeTemplate.label}」會寫入商品主檔，請使用{" "}
            <Link href={activeTemplate.externalHref ?? "/admin/products/import"} className="text-primary underline">
              商品匯入頁
            </Link>
            。此處可先下載中文範本。
          </div>
        ) : null}
      </section>

      <section id="export" className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-[#6F4E37]" />
          <h2 className="text-lg font-semibold text-[#2F2925]">Excel 匯出</h2>
        </div>
        <p className="text-sm text-[#756B64]">一鍵下載目前門市資料（中文欄位）。</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORE_EXCEL_EXPORTS.map((exp) => (
            <a
              key={exp.id}
              href={`/api/admin/store/export?type=${exp.id}`}
              className="rounded-[16px] border border-[#E9DED4] bg-white p-4 transition hover:border-[#FFE149] hover:bg-[#FFFBEA]"
            >
              <p className="font-medium text-[#2F2925]">{exp.label}</p>
              <p className="mt-1 text-sm text-[#756B64]">{exp.description}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#6F4E37]">
                <Download className="h-4 w-4" />
                下載 {exp.fileStem}.xlsx
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
