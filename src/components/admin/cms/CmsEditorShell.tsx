"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CmsPage } from "@/types/cms";
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

type Props = {
  initialPage: CmsPage;
  legacyHref?: string;
  /** Local canvas edits only — do not write live contracts */
  readOnly?: boolean;
  allowLocalEdit?: boolean;
  versions?: CmsVersionLite[];
  onSaveDraft?: (page: CmsPage) => Promise<void> | void;
  onPublish?: (page: CmsPage) => Promise<void> | void;
  onRestoreVersion?: (versionId: string) => Promise<void> | void;
  description?: string;
};

export function CmsEditorShell({
  initialPage,
  legacyHref,
  readOnly = true,
  allowLocalEdit = true,
  versions = [],
  onSaveDraft,
  onPublish,
  onRestoreVersion,
  description,
}: Props) {
  const editor = useCmsEditor(initialPage);
  const [mobileTab, setMobileTab] = useState<"library" | "canvas" | "props">(
    "canvas"
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    editor.loadPage(initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when page id / blocks source changes
  }, [initialPage.id, initialPage.updatedAt, initialPage.blockCount]);

  const interactive = allowLocalEdit && !readOnly;
  // Phase 1–2: local edits allowed even when "readOnly" means no server write
  const canMutateLocal = allowLocalEdit;
  const page = editor.page;

  const validation = page
    ? summarizeValidation(validateCmsPageForPublish(page))
    : { canPublish: false, errors: [], warnings: [] };

  const handleSave = async () => {
    if (!page || !onSaveDraft) return;
    editor.setSaveStatus("saving");
    try {
      await onSaveDraft(page);
      editor.markClean();
      setNotice("草稿已儲存（既有 draft API）");
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
      setNotice("已發布至正式站");
    } catch (e) {
      editor.setSaveStatus("error");
      setNotice(e instanceof Error ? e.message : "發布失敗");
    }
  };

  const tabs = [
    { id: "library" as const, label: "區塊庫" },
    { id: "canvas" as const, label: "畫布" },
    { id: "props" as const, label: "屬性" },
  ];

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col gap-3">
      <CmsEditorToolbar
        title={page?.name ?? initialPage.name}
        description={
          description ??
          "畫布編輯器：本機拖拉／復原；儲存與發布接線前不改正式前台契約。"
        }
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
        legacyHref={legacyHref}
        readOnly={!canMutateLocal}
        saveDisabled={!onSaveDraft || !interactive}
        publishDisabled={!onPublish || !interactive || !validation.canPublish}
        onSaveDraft={onSaveDraft ? handleSave : undefined}
        onPublish={onPublish ? handlePublish : undefined}
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
    </div>
  );
}
