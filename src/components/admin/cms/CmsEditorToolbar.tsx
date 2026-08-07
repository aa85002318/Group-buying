"use client";

import Link from "next/link";
import { Eye, Redo2, Save, Square, Undo2, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CMS_SAVE_STATUS_LABEL,
  type CmsDevice,
  type CmsSaveStatus,
} from "@/types/cms";
import { CmsCanvasDeviceSwitcher } from "@/components/admin/cms/CmsCanvasDeviceSwitcher";

type Props = {
  title: string;
  description?: string;
  saveStatus: CmsSaveStatus;
  activeDevice: CmsDevice;
  onDeviceChange: (d: CmsDevice) => void;
  showBlockBounds: boolean;
  onToggleBounds: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  previewPath?: string;
  backHref?: string;
  legacyHref?: string;
  readOnly?: boolean;
  publishDisabled?: boolean;
  saveDisabled?: boolean;
  extraActions?: React.ReactNode;
};

export function CmsEditorToolbar({
  title,
  description,
  saveStatus,
  activeDevice,
  onDeviceChange,
  showBlockBounds,
  onToggleBounds,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveDraft,
  onPublish,
  previewPath,
  backHref = "/admin/frontend-cms",
  legacyHref,
  readOnly,
  publishDisabled = true,
  saveDisabled = true,
  extraActions,
}: Props) {
  return (
    <div className="space-y-3 border-b border-[var(--admin-border,#ECECEC)] bg-white/90 pb-3 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[var(--admin-muted,#8A94A6)]">
            <Link href={backHref} className="hover:text-[#153E73] hover:underline">
              前台 CMS
            </Link>
            <span>/</span>
            <span className="text-[#153E73]">{title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[#153E73] md:text-2xl">{title}</h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                saveStatus === "dirty" && "bg-[#FFF5CC] text-[#153E73]",
                saveStatus === "saving" && "bg-[#EEF8FC] text-[#153E73]",
                saveStatus === "saved" && "bg-[#E8F8EF] text-[#1B6B3A]",
                saveStatus === "published" && "bg-[#FFE149] text-[#153E73]",
                saveStatus === "error" && "bg-[#FDE8E6] text-[#B42318]",
                (saveStatus === "idle" || !saveStatus) && "bg-[#F3F4F6] text-[#6B7280]"
              )}
            >
              {CMS_SAVE_STATUS_LABEL[saveStatus]}
            </span>
            {readOnly ? (
              <span className="rounded-full bg-[#EEF8FC] px-2.5 py-0.5 text-xs font-semibold text-[#153E73]">
                唯讀預覽
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-[var(--admin-muted,#8A94A6)]">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {legacyHref ? (
            <Link
              href={legacyHref}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              經典編輯器
            </Link>
          ) : null}
          {previewPath ? (
            <a
              href={previewPath}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              前台預覽
            </a>
          ) : null}
          {extraActions}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canUndo || readOnly}
          onClick={onUndo}
          title="復原"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canRedo || readOnly}
          onClick={onRedo}
          title="重做"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showBlockBounds ? "default" : "outline"}
          className={cn(
            showBlockBounds &&
              "border-[#FFE149] bg-[#FFE149] text-[#153E73] hover:bg-[#FFE149]/90"
          )}
          onClick={onToggleBounds}
        >
          <Square className="mr-1 h-3.5 w-3.5" />
          區塊邊界
        </Button>
        <CmsCanvasDeviceSwitcher value={activeDevice} onChange={onDeviceChange} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saveDisabled || readOnly || !onSaveDraft}
            onClick={onSaveDraft}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            儲存草稿
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={publishDisabled || readOnly || !onPublish}
            onClick={onPublish}
            className="bg-[#153E73] text-white hover:bg-[#153E73]/90"
          >
            <Upload className="mr-1 h-3.5 w-3.5" />
            發布
          </Button>
        </div>
      </div>
    </div>
  );
}
