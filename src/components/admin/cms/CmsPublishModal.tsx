"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { CmsPage } from "@/types/cms";
import {
  summarizeValidation,
  validateCmsPageForPublish,
  type CmsValidationIssue,
} from "@/lib/cms/cms-validation";
import type { PageBuilderPlatform } from "@/lib/cms/page-builder";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  platform: PageBuilderPlatform;
  page: CmsPage | null;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

export function CmsPublishModal({
  open,
  platform,
  page,
  onClose,
  onConfirm,
  busy,
}: Props) {
  const validation = useMemo(() => {
    if (!page) {
      return {
        canPublish: false,
        errors: [] as CmsValidationIssue[],
        warnings: [] as CmsValidationIssue[],
      };
    }
    return summarizeValidation(validateCmsPageForPublish(page));
  }, [page]);

  if (!open) return null;

  const label = platform === "desktop" ? "Desktop" : "Mobile";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        className="w-full max-w-md rounded-[16px] border border-[#E9EDF2] bg-white p-5 shadow-xl"
      >
        <h2 className="text-lg font-bold text-[#153E73]">準備發布</h2>
        <p className="mt-1 text-sm text-[#687386]">
          發布版型：
          <span className="ml-1 font-semibold text-[#153E73]">● {label}</span>
          （不會同時發布另一管道）
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2 text-[#1B6B3A]">
            <span>✓</span> 內容共用 · 版型獨立
          </li>
          <li
            className={cn(
              "flex items-center gap-2",
              validation.errors.length ? "text-[#B42318]" : "text-[#1B6B3A]"
            )}
          >
            <span>{validation.errors.length ? "!" : "✓"}</span>
            {validation.errors.length
              ? `尚有 ${validation.errors.length} 項錯誤`
              : "Required Settings 通過"}
          </li>
          {validation.warnings.slice(0, 3).map((w) => (
            <li
              key={w.code + w.message}
              className="flex items-start gap-2 text-[#687386]"
            >
              <span>·</span>
              <span>{w.message}</span>
            </li>
          ))}
        </ul>

        {validation.errors.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-[10px] bg-[#FDE8E6] px-3 py-2 text-xs text-[#B42318]">
            {validation.errors.map((e) => (
              <li key={e.code + e.message}>{e.message}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button
            type="button"
            disabled={!validation.canPublish || busy}
            className="bg-[#153E73] text-white hover:bg-[#153E73]/90"
            onClick={onConfirm}
          >
            {busy ? "發布中…" : `確認發布 ${label}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
