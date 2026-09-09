"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CmsDevice, CmsPage } from "@/types/cms";
import { CMS_PREVIEW_WIDTH_PRESETS } from "@/types/cms";
import { useCmsEditor } from "@/hooks/useCmsEditor";
import { CmsEditorToolbar } from "@/components/admin/cms/CmsEditorToolbar";
import { CmsBlockLibrary } from "@/components/admin/cms/CmsBlockLibrary";
import { CmsCanvas } from "@/components/admin/cms/CmsCanvas";
import { CmsPropertyPanel } from "@/components/admin/cms/CmsPropertyPanel";
import { CmsPublishValidation } from "@/components/admin/cms/CmsPublishValidation";
import {
  CmsVersionHistoryPanel,
  type CmsVersionLite,
} from "@/components/admin/cms/CmsVersionHistoryPanel";
import { summarizeValidation, validateCmsPageForPublish } from "@/lib/cms/cms-validation";
import { PAGE_BUILDER_BASE } from "@/lib/cms/page-builder";

type Props = {
  initialPage: CmsPage;
  legacyHref?: string;
  legacyLabel?: string;
  /** Local canvas edits only — do not write live contracts */
  readOnly?: boolean;
  allowLocalEdit?: boolean;
  versions?: CmsVersionLite[];
  onSaveDraft?: (page: CmsPage) => Promise<void> | void;
  onPublish?: (page: CmsPage) => Promise<void> | void;
  onRestoreVersion?: (versionId: string) => Promise<void> | void;
  description?: string;
  layoutVariant?: "classic" | "split-preview";
  backHref?: string;
  initialDevice?: CmsDevice;
};

export function CmsEditorShell({
  initialPage,
  legacyHref,
  legacyLabel,
  readOnly = true,
  allowLocalEdit = true,
  versions = [],
  onSaveDraft,
  onPublish,
  onRestoreVersion,
  description,
  layoutVariant = "classic",
  backHref = PAGE_BUILDER_BASE,
  initialDevice,
}: Props) {
  const editor = useCmsEditor(initialPage);
  const [mobileTab, setMobileTab] = useState<"library" | "canvas" | "props">(
    "canvas"
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    editor.loadPage(initialPage);
    if (initialDevice) editor.setDevice(initialDevice);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when page id / blocks source changes
  }, [initialPage.id, initialPage.updatedAt, initialPage.blockCount, initialDevice]);

  useEffect(() => {
    const presets = CMS_PREVIEW_WIDTH_PRESETS[editor.activeDevice];
    setPreviewWidth((prev) =>
      prev != null && presets.includes(prev) ? prev : presets[1] ?? presets[0]
    );
  }, [editor.activeDevice]);

  const interactive = allowLocalEdit && !readOnly;
  const canMutateLocal = allowLocalEdit;
  const page = editor.page;
  const split = layoutVariant === "split-preview";

  const validation = page
    ? summarizeValidation(validateCmsPageForPublish(page))
    : { canPublish: false, errors: [], warnings: [] };

  const iframeSrc = useMemo(() => {
    const path = page?.previewPath || initialPage.previewPath || "/";
    return path.startsWith("http") ? path : path;
  }, [initialPage.previewPath, page?.previewPath]);

  const handleSave = async () => {
    if (!page || !onSaveDraft) return;
    editor.setSaveStatus("saving");
    try {
      await onSaveDraft(page);
      editor.markClean();
      setNotice("草稿已儲存（尚未發佈）");
    } catch (e) {
      editor.setSaveStatus("error");
      setNotice(e instanceof Error ? e.message : "儲存失敗");
    }
  };

  const handlePublish = async () => {
    if (!page || !onPublish || !validation.canPublish) return;
    editor.setSaveStatus("saving");
    try {
      await onPublish(page);
      editor.setSaveStatus("published");
      setNotice("已發佈至目前環境（staging）");
    } catch (e) {
      editor.setSaveStatus("error");
      setNotice(e instanceof Error ? e.message : "發布失敗");
    }
  };

  const widthPresets = CMS_PREVIEW_WIDTH_PRESETS[editor.activeDevice];

  const tabs = [
    { id: "library" as const, label: "區塊庫" },
    { id: "canvas" as const, label: "區塊" },
    { id: "props" as const, label: "設定" },
  ];

  const blockPanel = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {libraryOpen || !split ? (
        <div
          className={cn(
            "overflow-hidden rounded-[16px] border border-[#E9EDF2] bg-white",
            split ? "max-h-56" : "min-h-[280px] flex-1"
          )}
        >
          <CmsBlockLibrary
            pageId={page?.id ?? initialPage.id}
            onAddBlock={(type) => {
              if (!canMutateLocal) return;
              editor.addBlock(type);
              setMobileTab("canvas");
              setLibraryOpen(false);
            }}
            disabled={!canMutateLocal}
          />
        </div>
      ) : (
        <button
          type="button"
          className="rounded-[12px] border border-dashed border-[#153E73]/30 bg-white px-3 py-2 text-left text-sm font-semibold text-[#153E73] hover:bg-[#FFFDF6]"
          onClick={() => setLibraryOpen(true)}
          disabled={!canMutateLocal}
        >
          + 新增區塊
        </button>
      )}

      <div className="min-h-0 flex-1 overflow-hidden rounded-[16px] border border-[#E9EDF2] bg-white">
        <CmsCanvas
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
          device={editor.activeDevice}
          showBounds={editor.showBlockBounds}
          readOnly={!canMutateLocal}
        />
      </div>

      <div className="h-[min(40vh,320px)] overflow-hidden rounded-[16px] border border-[#E9EDF2] bg-white xl:h-[280px]">
        <CmsPropertyPanel
          block={editor.selectedBlock}
          pageId={page?.id ?? initialPage.id}
          readOnly={!canMutateLocal}
          onChange={editor.updateSelectedBlock}
        />
      </div>
      <CmsPublishValidation page={page} />
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
    </div>
  );

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col gap-3">
      <CmsEditorToolbar
        title={page?.name ?? initialPage.name}
        description={description}
        saveStatus={editor.saveStatus}
        activeDevice={editor.activeDevice}
        onDeviceChange={editor.setDevice}
        showBlockBounds={editor.showBlockBounds}
        onToggleBounds={() => editor.setShowBounds(!editor.showBlockBounds)}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        previewPath={page?.previewPath}
        backHref={backHref}
        backLabel="Page Builder"
        legacyHref={legacyHref}
        legacyLabel={legacyLabel}
        readOnly={!canMutateLocal}
        saveDisabled={!onSaveDraft || !interactive}
        publishDisabled={!onPublish || !interactive || !validation.canPublish}
        onSaveDraft={onSaveDraft ? handleSave : undefined}
        onPublish={onPublish ? handlePublish : undefined}
        previewWidth={previewWidth}
        previewWidthPresets={widthPresets}
        onPreviewWidthChange={setPreviewWidth}
      />

      {notice ? (
        <p className="rounded-[12px] bg-[#EEF8FC] px-3 py-2 text-sm text-[#153E73]">
          {notice}
        </p>
      ) : null}

      <div className="flex gap-1 rounded-[18px] border border-[#ECECEC] bg-white p-1 lg:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              "flex-1 rounded-[14px] px-3 py-2.5 text-sm font-semibold transition",
              mobileTab === t.id
                ? "bg-[#FFE149] text-[#153E73]"
                : "text-[#153E73]/70 hover:bg-[#FFF7CC]"
            )}
            onClick={() => setMobileTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {split ? (
        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <div
            className={cn(
              "min-h-[420px] overflow-auto rounded-[20px] border border-[#E9EDF2] bg-[#F3F4F6] p-4 xl:min-h-0",
              mobileTab === "canvas" ? "block" : "hidden xl:block"
            )}
          >
            <div className="mx-auto overflow-hidden rounded-[12px] border border-[#E9EDF2] bg-white shadow-sm"
              style={{
                width: previewWidth ?? undefined,
                maxWidth: "100%",
                minHeight: 520,
              }}
            >
              <iframe
                title="CMS Preview"
                src={iframeSrc}
                className="h-[70vh] w-full border-0 bg-white"
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-[#8A94A6]">
              即時預覽（iframe）。修改先存在編輯器，儲存草稿後才寫入 DB；發佈後前台才更新。
            </p>
          </div>
          <div
            className={cn(
              "sticky top-2 max-h-[calc(100dvh-6rem)] overflow-y-auto xl:block",
              mobileTab === "props" || mobileTab === "library"
                ? "block"
                : "hidden xl:block"
            )}
          >
            {blockPanel}
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(300px,360px)]">
          <div
            className={cn(
              "min-h-[320px] overflow-hidden rounded-[20px] border border-[#ECECEC] bg-white shadow-[0_10px_35px_rgba(0,0,0,.05)] xl:min-h-0",
              mobileTab === "library" ? "block" : "hidden xl:block"
            )}
          >
            <CmsBlockLibrary
              pageId={page?.id ?? initialPage.id}
              onAddBlock={(type) => {
                if (!canMutateLocal) return;
                editor.addBlock(type);
                setMobileTab("canvas");
              }}
              disabled={!canMutateLocal}
            />
          </div>

          <div
            className={cn(
              "min-h-[420px] overflow-hidden rounded-[20px] border border-[#ECECEC] bg-white shadow-[0_10px_35px_rgba(0,0,0,.05)] xl:min-h-0",
              mobileTab === "canvas" ? "block" : "hidden xl:block"
            )}
          >
            <CmsCanvas
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
              device={editor.activeDevice}
              showBounds={editor.showBlockBounds}
              readOnly={!canMutateLocal}
            />
          </div>

          <div
            className={cn(
              "min-h-[320px] space-y-3 overflow-hidden xl:min-h-0",
              mobileTab === "props" ? "block" : "hidden xl:block"
            )}
          >
            <div className="h-[min(52vh,420px)] overflow-hidden rounded-[20px] border border-[#ECECEC] bg-white shadow-[0_10px_35px_rgba(0,0,0,.05)] xl:h-[calc(100%-11rem)]">
              <CmsPropertyPanel
                block={editor.selectedBlock}
                pageId={page?.id ?? initialPage.id}
                readOnly={!canMutateLocal}
                onChange={editor.updateSelectedBlock}
              />
            </div>
            <CmsPublishValidation page={page} />
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
          </div>
        </div>
      )}
    </div>
  );
}
