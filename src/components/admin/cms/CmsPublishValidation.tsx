"use client";

import {
  summarizeValidation,
  validateCmsPageForPublish,
} from "@/lib/cms/cms-validation";
import type { CmsPage } from "@/types/cms";
import { cn } from "@/lib/utils";

export function CmsPublishValidation({
  page,
  className,
}: {
  page: CmsPage | null;
  className?: string;
}) {
  if (!page) return null;
  const issues = validateCmsPageForPublish(page);
  const { errors, warnings, canPublish } = summarizeValidation(issues);

  return (
    <div
      className={cn(
        "rounded-[14px] border border-[#E7EAF0] bg-white p-3 text-sm",
        className
      )}
    >
      <p className="mb-2 font-bold text-[#153E73]">發布檢查</p>
      {issues.length === 0 ? (
        <p className="text-[#1B6B3A]">通過基本檢查，可進入發布流程。</p>
      ) : (
        <ul className="space-y-1.5">
          {errors.map((i) => (
            <li key={`${i.code}-${i.blockId ?? ""}-e`} className="text-[#B42318]">
              [錯誤] {i.message}
            </li>
          ))}
          {warnings.map((i) => (
            <li key={`${i.code}-${i.blockId ?? ""}-w`} className="text-[#9A6700]">
              [提醒] {i.message}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-[#8A94A6]">
        {canPublish
          ? "畫布階段：發布按鈕仍連至既有草稿 API（未接線時為停用）。"
          : "請先修正錯誤再發布。"}
      </p>
    </div>
  );
}
