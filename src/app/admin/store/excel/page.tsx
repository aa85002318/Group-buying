"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImportPreview } from "@/components/admin/store/AdminImportPreview";
import { Button } from "@/components/ui/button";
import {
  STORE_EXCEL_EXPORTS,
  STORE_EXCEL_GROUPS,
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
        description="全部中文檔名與欄位。流程：下載範本 → 上傳 → 預覽／錯誤明細 → 人工確認 → 正式匯入。"
        actions={
          <Link href="/admin/store/batches">
            <Button type="button" variant="outline">
              批次管理
            </Button>
          </Link>
        }
      />

      <section id="import" className="space-y-6">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-[#153E73]" />
          <h2 className="text-lg font-semibold text-[#2F2925]">下載範本與匯入</h2>
        </div>
        <p className="text-sm text-[#756B64]">
          協作／工作類範本僅供欄位對照，實際建立請走對應頁面。商品處理與庫存價格可在此預覽後正式匯入。
        </p>

        {STORE_EXCEL_GROUPS.map((group) => {
          const items = STORE_EXCEL_TEMPLATES.filter((t) => t.group === group.id);
          if (!items.length) return null;
          return (
            <div key={group.id} className="space-y-3">
              <h3 className="text-sm font-semibold text-[#153E73]">{group.label}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tpl) => {
                  const selected = activeImport === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setActiveImport(tpl.id)}
                      className={cn(
                        "rounded-[16px] border p-4 text-left transition",
                        selected
                          ? "border-[#FFE149] bg-[#FFF8D6]"
                          : "border-[#E5E8EE] bg-white hover:border-[#FFE149]/hover:bg-[#FFFBEA]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[#2F2925]">{tpl.label}</p>
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#153E73]" />
                      </div>
                      <p className="mt-1 text-sm text-[#756B64]">{tpl.description}</p>
                      <p className="mt-2 text-xs text-[#9A928A]">{tpl.fileStem}.xlsx</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={`/api/admin/store/import?type=${tpl.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#153E73] underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          下載範本
                        </a>
                        {tpl.externalHref ? (
                          <Link
                            href={tpl.externalHref}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-[#153E73] underline"
                          >
                            {tpl.supportsStoreImport ? "相關頁面" : "前往建立"}
                          </Link>
                        ) : null}
                        {tpl.supportsStoreImport ? (
                          <span className="text-xs text-[#2E7D5B]">可匯入</span>
                        ) : (
                          <span className="text-xs text-[#9A928A]">僅範本</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {activeTemplate?.supportsStoreImport ? (
          <div className="space-y-2">
            <h3 className="font-medium text-[#2F2925]">匯入：{activeTemplate.label}</h3>
            <p className="text-sm text-[#756B64]">
              欄位：{activeTemplate.headers.join("、")}
            </p>
            <AdminImportPreview importType={activeImport} />
          </div>
        ) : activeTemplate ? (
          <div className="rounded-[16px] border border-[#E5E8EE] bg-[#F7F8FA] p-4 text-sm text-[#756B64]">
            「{activeTemplate.label}」僅提供中文範本下載
            {activeTemplate.externalHref ? (
              <>
                ，實際建立請至{" "}
                <Link
                  href={activeTemplate.externalHref}
                  className="font-medium text-[#153E73] underline"
                >
                  對應頁面
                </Link>
              </>
            ) : null}
            。
          </div>
        ) : null}
      </section>

      <section id="export" className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-[#153E73]" />
          <h2 className="text-lg font-semibold text-[#2F2925]">Excel 匯出</h2>
        </div>
        <p className="text-sm text-[#756B64]">一鍵下載目前門市資料（中文檔名與欄位）。</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORE_EXCEL_EXPORTS.map((exp) => (
            <a
              key={exp.id}
              href={`/api/admin/store/export?type=${exp.id}`}
              className="rounded-[16px] border border-[#E5E8EE] bg-white p-4 transition hover:border-[#FFE149] hover:bg-[#FFFBEA]"
            >
              <p className="font-medium text-[#2F2925]">{exp.label}</p>
              <p className="mt-1 text-sm text-[#756B64]">{exp.description}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#153E73]">
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
