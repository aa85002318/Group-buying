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
import { getBlockDefinition } from "@/lib/cms/block-registry";
import { CmsPropertyPanel } from "@/components/admin/cms/CmsPropertyPanel";
import { CmsPublishModal } from "@/components/admin/cms/CmsPublishModal";
import {
  CmsVersionHistoryPanel,
  type CmsVersionLite,
} from "@/components/admin/cms/CmsVersionHistoryPanel";
import { summarizeValidation, validateCmsPageForPublish } from "@/lib/cms/cms-validation";
import {
  PAGE_BUILDER_BASE,
  PAGE_BUILDER_DEFAULT_WIDTH,
  isPageLive,
  PAGE_BUILDER_UNIFIED_WIDTHS,
  pageBuilderPlatformHref,
  pageBuilderPreviewSrc,
  type PageBuilderPlatform,
} from "@/lib/cms/page-builder";
import { CmsScaledPreview } from "@/components/admin/cms/CmsScaledPreview";
import {
  DEFAULT_HOME_LAYOUT_SETTINGS,
  HOME_SPACING_LABELS,
  normalizeHomeLayoutSettings,
  type HomeDevice,
  type HomeLayoutSettings,
  type HomeSpacing,
} from "@/lib/home/layout-device";

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
  const [previewReload, setPreviewReload] = useState(0);
  const [mobilePane, setMobilePane] = useState<"blocks" | "preview" | "props">(
    "preview"
  );
  // 桌機 / 手機：切換要編輯哪一個版型（內容兩邊共用）。
  const [device, setDevice] = useState<HomeDevice>("desktop");
  const [layoutSettings, setLayoutSettings] = useState<HomeLayoutSettings>(
    DEFAULT_HOME_LAYOUT_SETTINGS
  );
  const [savingSpacing, setSavingSpacing] = useState(false);

  useEffect(() => {
    if (initialPage.id !== "home") return;
    fetch("/api/admin/home/layout-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) setLayoutSettings(normalizeHomeLayoutSettings(d.settings));
      })
      .catch(() => {});
  }, [initialPage.id]);

  const saveSpacing = async (next: HomeLayoutSettings) => {
    setLayoutSettings(next);
    setSavingSpacing(true);
    try {
      const res = await fetch("/api/admin/home/layout-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: next }),
      });
      if (!res.ok) throw new Error("間距儲存失敗");
      setNotice("整頁間距已儲存，重新整理前台即可看到。");
      setPreviewReload((n) => n + 1);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "間距儲存失敗");
    } finally {
      setSavingSpacing(false);
    }
  };

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

  const pageId = page?.id ?? initialPage.id;
  const live = isPageLive(pageId, platform);
  const iframeSrc = useMemo(() => {
    const path = page?.previewPath || initialPage.previewPath || "/";
    return pageBuilderPreviewSrc(pageId, platform, path);
  }, [initialPage.previewPath, page?.previewPath, pageId, platform]);

  // One設定 for every device: the storefront lays the same blocks out
  // responsively, so the editor shows one scope and two preview sizes.
  const widths: number[] = [...PAGE_BUILDER_UNIFIED_WIDTHS];
  const scopeLabel = device === "mobile" ? "手機版版面" : "桌機版版面";
  const previewLabel = device === "mobile" ? "手機版" : "桌機版";
  const hubHref = pageBuilderPlatformHref(platform);

  const handleSave = async () => {
    if (!page || !onSaveDraft) return;
    editor.setSaveStatus("saving");
    try {
      await onSaveDraft(page);
      editor.markClean();
      setPreviewReload((n) => n + 1);
      setNotice(
        live
          ? "草稿已儲存。右側預覽已更新為草稿內容；按「發布」後網站才會改變。"
          : "草稿已儲存。此頁尚未連動網站，發布後前台也不會改變。"
      );
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
      setPreviewReload((n) => n + 1);
      setNotice(`已發布（${scopeLabel}），網站重新整理後即可看到。`);
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
          href={PAGE_BUILDER_BASE}
          className="text-xs font-medium text-[#687386] hover:text-[#153E73] hover:underline"
        >
          ← 頁面清單
        </Link>
        <span className="rounded-full bg-[#EEF8FC] px-2 py-0.5 text-[11px] font-semibold text-[#153E73]">
          {scopeLabel}
        </span>

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
          <div className="flex rounded-md border border-[#E9EDF2] bg-white p-0.5" role="group" aria-label="編輯裝置">
            {([
              ["desktop", "桌機版", widths[widths.length - 1] ?? 1440],
              ["mobile", "手機版", widths[0] ?? 390],
            ] as const).map(([value, label, width]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setDevice(value);
                  setPreviewWidth(width);
                }}
                className={cn(
                  "h-7 rounded px-2.5 text-xs font-semibold",
                  device === value ? "bg-[#FFE149] text-[#153E73]" : "text-[#687386]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

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
              // 放在目前選取的區塊下面，並直接跳到「設定」，
              // 使用者按下去就看得到要填什麼。
              editor.insertBlockAfter(type, editor.selectedBlockId);
              setMobilePane("props");
              setNotice(
                `已新增「${getBlockDefinition(type)?.name ?? type}」。請在右側「內容」把資料填好，再按「儲存草稿」，最後按「發布」網站才會改變。`
              );
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
          <CmsScaledPreview src={iframeSrc} width={previewWidth} reloadKey={previewReload} />
          <p className="mt-2 text-center text-[11px] text-[#8A94A6]">
            {previewLabel}預覽 · 寬 {previewWidth}px ·{" "}
            {live
              ? "顯示已儲存的草稿（未儲存的變更不會出現）"
              : "此頁尚未連動網站，預覽顯示的是目前前台畫面"}
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
              device={device}
              readOnly={!canMutateLocal}
              onChange={editor.updateSelectedBlock}
              pageSettings={
                (page?.id ?? initialPage.id) === "home" ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-[#687386]">
                      整頁的區塊間距（目前設定：
                      <span className="font-semibold text-[#153E73]">
                        {device === "mobile" ? "手機版" : "桌機版"}
                      </span>
                      ）。個別區塊可以在「版型」再微調。
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(HOME_SPACING_LABELS) as HomeSpacing[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          disabled={!canMutateLocal || savingSpacing}
                          onClick={() =>
                            void saveSpacing({
                              ...layoutSettings,
                              spacing: { ...layoutSettings.spacing, [device]: value },
                            })
                          }
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold",
                            layoutSettings.spacing[device] === value
                              ? "bg-[#153E73] text-white"
                              : "bg-[#F2F4F7] text-[#153E73]"
                          )}
                        >
                          {HOME_SPACING_LABELS[value]}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#8A94A6]">
                      間距會立即儲存，不需要按發布。
                    </p>
                  </div>
                ) : undefined
              }
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
