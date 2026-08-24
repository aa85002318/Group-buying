"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  mode: "create" | "edit";
  isPublished: boolean;
  dirty: boolean;
  saving: boolean;
  autoSaveLabel?: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onDuplicate?: () => void;
};

export function ProductFormHeader({
  mode,
  isPublished,
  dirty,
  saving,
  autoSaveLabel,
  onSaveDraft,
  onPublish,
  onPreview,
  onDuplicate,
}: Props) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs text-[#8A94A6]">
          <Link
            href="/admin/products"
            className="hover:underline"
            onClick={(e) => {
              if (dirty && !window.confirm("商品資料尚未儲存，確定要離開嗎？")) {
                e.preventDefault();
              }
            }}
          >
            商品管理
          </Link>
          <span className="mx-1">＞</span>
          {mode === "create" ? "新增商品" : "編輯商品"}
        </p>
        <h1 className="text-xl font-semibold text-[#153E73]">{mode === "create" ? "新增商品" : "編輯商品"}</h1>
        {dirty ? <p className="text-xs font-medium text-[#B45309]">尚有未儲存的變更</p> : null}
        {autoSaveLabel ? <p className="text-xs text-[#8A94A6]">{autoSaveLabel}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={onSaveDraft}>
          {saving ? "儲存中..." : isPublished ? "儲存" : "儲存草稿"}
        </Button>
        <Button type="button" variant="outline" className="hidden sm:inline-flex" onClick={onPreview}>
          預覽
        </Button>
        <Button type="button" variant="outline" size="icon" className="sm:hidden" aria-label="預覽" onClick={onPreview}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button type="button" className="bg-[#153E73] text-white hover:bg-[#0F2E56]" disabled={saving} onClick={onPublish}>
          {saving ? "儲存中..." : isPublished ? "更新商品" : "上架"}
        </Button>
        {mode === "edit" && onDuplicate ? (
          <Button type="button" variant="outline" onClick={onDuplicate}>
            複製商品
          </Button>
        ) : null}
      </div>
    </header>
  );
}
