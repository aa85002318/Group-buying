"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, History, Redo2, Save, Undo2, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CmsPage, CmsSaveStatus } from "@/types/cms";
import { CMS_SAVE_STATUS_LABEL } from "@/types/cms";
import { useCmsEditor } from "@/hooks/useCmsEditor";
import { CmsBlockRail } from "@/components/admin/cms/CmsBlockRail";
import { CmsPropertyPanel } from "@/components/admin/cms/CmsPropertyPanel";
import { CmsPublishModal } from "@/components/admin/cms/CmsPublishModal";
import {
  CmsVersionHistoryPanel,
  type CmsVersionLite,
} from "@/components/admin/cms/CmsVersionHistoryPanel";
import { summarizeValidation, validateCmsPageForPublish } from "@/lib/cms/cms-validation";
import {
  PAGE_BUILDER_DEFAULT_WIDTH,
  PAGE_BUILDER_PREVIEW_WIDTHS,
  pageBuilderPlatformHref,
  platformLabel,
  type PageBuilderPlatform,
} from "@/lib/cms/page-builder";

type Props = {
  initialPage: CmsPage;
  platform: PageBuilderPlatform;
  legacyHref?: string;
  legacyLabel?: string;
  readOnly?: boolean;
  allowLocalEdit?: boolean;
  versions?: CmsVersionLite[];
  onSaveDraft?: (page: CmsPage) => Promise<void> | void;
  onPublish?: (page: CmsPage) => Promise<void> | void;
  onRestoreVersion?: (versionId: string) => Promise<void> | void;
  pageOptions?: Array<{ id: string; name: string }>;
};

export function CmsEditorShell({
  initialPage,
  platform,
  legacyHref,
  legacyLabel = "經典編輯器",
  readOnly = true,
  allowLocalEdit = true,
  versions = [],
  onSaveDraft,
  onPublish,
  onRestoreVersion,
  pageOptions = [],
}: Props) {
  const editor = useCmsEditor(initialPage);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(
    PAGE_BUILDER_DEFAULT_WIDTH[platform]
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [mobilePane, setMobilePane] = useState<"blocks" | "preview" | "props">(
    "preview"
  );

  useEffect(() => {
    editor.loadPage(initialPage);
    editor.setDevice(platform === "desktop" ? "desktop" : "mobile");
    setPreviewWidth(PAGE_BUILDER_DEFAULT_WIDTH[platform]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage.id, initialPage.updatedAt, initialPage.blockCount, platform]);

  const interactive = allowLocalEdit && !readOnly;
  const canMutateLocal = allowLocalEdit;
  const page = editor.page;

  const validation = page
    ? summarizeValidation(validateCmsPageForPublish(page))
    : { canPublish: false, errors: [], warnings: [] };

  const iframeSrc = useMemo(() => {
    const path = page?.previewPath || initialPage.previewPath || "/";
    return path;
  }, [initialPage.previewPath, page?.previewPath]);

  const widths = PAGE_BUILDER_PREVIEW_WIDTHS[platform];
  const hubHref = pageBuilderPlatformHref(platform);

  const handleSave = async () => {
    if (!page || !onSaveDraft) return;
    editor.setSaveStatus("saving");
    try {
      await onSaveDraft(page);
      editor.markClean();
      setNotice("草稿已儲存（尚未發布）");
    } catch (e) {
      editor.setSaveStatus("error");
      setNotice(e instanceof Error ? e.message : "儲存失敗");
    }
  };

  const handlePublishConfirm = async () => {
    if (!page || !onPublish || !validation.canPublish) return;
    setPublishBusy(true);
    editor.setSaveStatus("saving");
    try {
      await onPublish(page);
      editor.setSaveStatus("published");
      setNotice(`已發布 ${platform === "desktop" ? "Desktop" : "Mobile"} 版型`);
      setPublishOpen(false);
    } catch (e) {
      editor.setSaveStatus("error");
      setNotice(e instanceof Error ? e.message : "發布失敗");
    } finally {
      setPublishBusy(false);
    }
  };

  const statusLabel = (status: CmsSaveStatus) => {
    if (status === "dirty") return "● 尚未儲存";
    if (status === "saved") return `✓ ${CMS_SAVE_STATUS_LABEL.saved}`;
    return CMS_SAVE_STATUS_LABEL[status];
  };

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col gap-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E9EDF2] bg-white px-2 py-2">
        <Link
          href={hubHref}
          className="text-xs font-medium text-[#687386] hover:text-[#153E73] hover:underline"
        >
          ← {platformLabel(platform)}
        </Link>

        {pageOptions.length > 0 ? (
          <select
            className="h-9 max-w-[180px] rounded-md border border-[#E9EDF2] bg-white px-2 text-sm font-semibold text-[#153E73]"
            value={page?.id ?? initialPage.id}
            onChange={(e) => {
              window.location.href = `${hubHref}/${e.target.value}`;
            }}
          >
            {pageOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <h1 className="text-base font-bold text-[#153E73]">
            {page?.name ?? initialPage.name}
          </h1>
        )}

        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            editor.saveStatus === "dirty" && "bg-[#FFF5CC] text-[#153E73]",
            editor.saveStatus === "saved" && "bg-[#E8F8EF] text-[#1B6B3A]",
            editor.saveStatus === "published" && "bg-[#EEF8FC] text-[#153E73]",
            editor.saveStatus === "error" && "bg-[#FDE8E6] text-[#B42318]",
            (editor.saveStatus === "idle" || editor.saveStatus === "saving") &&
              "bg-[#F3F4F6] text-[#6B7280]"
          )}
        >
          {statusLabel(editor.saveStatus)}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <select
            className="h-8 rounded-md border border-[#E9EDF2] bg-white px-2 text-xs text-[#153E73]"
            value={previewWidth}
            onChange={(e) => setPreviewWidth(Number(e.target.value))}
            title="預覽尺寸"
          >
            {widths.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!editor.canUndo || !canMutateLocal}
            onClick={editor.undo}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!editor.canRedo || !canMutateLocal}
            onClick={editor.redo}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>

          {iframeSrc ? (
            <a
              href={iframeSrc}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              預覽
            </a>
          ) : null}

          {legacyHref ? (
            <Link
              href={legacyHref}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {legacyLabel}
            </Link>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowVersions((v) => !v)}
          >
            <History className="mr-1 h-3.5 w-3.5" />
            版本
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!onSaveDraft || !interactive}
            onClick={() => void handleSave()}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            儲存草稿
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!onPublish || !interactive}
            className="bg-[#153E73] text-white hover:bg-[#153E73]/90"
            onClick={() => setPublishOpen(true)}
          >
            <Upload className="mr-1 h-3.5 w-3.5" />
            發布
          </Button>
        </div>
      </div>

      {notice ? (
        <p className="rounded-[10px] bg-[#EEF8FC] px-3 py-2 text-sm text-[#153E73]">
          {notice}
        </p>
      ) : null}

      <div className="flex gap-1 rounded-[12px] border border-[#E9EDF2] bg-white p-1 xl:hidden">
        {(
          [
            ["blocks", "區塊"],
            ["preview", "預覽"],
            ["props", "設定"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              "flex-1 rounded-[10px] px-2 py-2 text-sm font-semibold",
              mobilePane === id
                ? "bg-[#FFD454] text-[#153E73]"
                : "text-[#687386]"
            )}
            onClick={() => setMobilePane(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3 columns: blocks | preview | settings */}
      <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[220px_minmax(0,1fr)_340px]">
        <div
          className={cn(
            "min-h-[360px] overflow-hidden rounded-[14px] border border-[#E9EDF2] xl:min-h-0",
            mobilePane === "blocks" ? "block" : "hidden xl:block"
          )}
        >
          <CmsBlockRail
            pageId={page?.id ?? initialPage.id}
            blocks={page?.blocks ?? []}
            selectedBlockId={editor.selectedBlockId}
            onSelect={editor.selectBlock}
            onReorder={editor.moveBlock}
            onDuplicate={editor.duplicateBlock}
            onRemove={editor.removeBlock}
            onToggleEnabled={(id, enabled) => {
              if (!page) return;
              editor.updateBlocks(
                page.blocks.map((b) => (b.id === id ? { ...b, enabled } : b))
              );
              editor.selectBlock(id);
            }}
            onAddBlock={(type) => {
              if (!canMutateLocal) return;
              editor.addBlock(type);
            }}
            readOnly={!canMutateLocal}
          />
        </div>

        <div
          className={cn(
            "min-h-[420px] overflow-auto rounded-[14px] border border-[#E9EDF2] bg-[#F3F4F6] p-3 xl:min-h-0",
            mobilePane === "preview" ? "block" : "hidden xl:block"
          )}
        >
          <div
            className="mx-auto overflow-hidden rounded-[10px] border border-[#E9EDF2] bg-white"
            style={{ width: previewWidth, maxWidth: "100%", minHeight: 480 }}
          >
            <iframe
              title="CMS Preview"
              src={iframeSrc}
              className="h-[min(72vh,820px)] w-full border-0 bg-white"
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-[#8A94A6]">
            {platform === "desktop" ? "Desktop" : "Mobile"} 預覽 · {previewWidth}px
            · 儲存草稿後才寫入 DB · 發布才上線
          </p>
        </div>

        <div
          className={cn(
            "flex min-h-[360px] flex-col gap-2 overflow-hidden xl:min-h-0",
            mobilePane === "props" ? "block" : "hidden xl:flex"
          )}
        >
          <div className="min-h-0 flex-1 overflow-hidden rounded-[14px] border border-[#E9EDF2]">
            <CmsPropertyPanel
              block={editor.selectedBlock}
              pageId={page?.id ?? initialPage.id}
              platform={platform}
              readOnly={!canMutateLocal}
              onChange={editor.updateSelectedBlock}
            />
          </div>
          {showVersions ? (
            <CmsVersionHistoryPanel
              versions={versions}
              disabled={!onRestoreVersion}
              onRestoreAsDraft={
                onRestoreVersion
                  ? (id) => {
                      void onRestoreVersion(id);
                    }
                  : undefined
              }
            />
          ) : null}
        </div>
      </div>

      <CmsPublishModal
        open={publishOpen}
        platform={platform}
        page={page}
        busy={publishBusy}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => void handlePublishConfirm()}
      />
    </div>
  );
}
