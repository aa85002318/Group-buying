"use client";

import { History } from "lucide-react";

export type CmsVersionLite = {
  id: string;
  version_number: number;
  status: string;
  label?: string | null;
  updated_at?: string;
  published_at?: string | null;
};

export function CmsVersionHistoryPanel({
  versions,
  onRestoreAsDraft,
  disabled,
}: {
  versions: CmsVersionLite[];
  onRestoreAsDraft?: (versionId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-[#E7EAF0] bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <History className="h-4 w-4 text-[#153E73]" />
        <p className="text-sm font-bold text-[#153E73]">版本歷史</p>
      </div>
      {versions.length === 0 ? (
        <p className="text-xs text-[#8A94A6]">尚無版本紀錄（或此頁尚未接草稿）。</p>
      ) : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-2 rounded-[10px] bg-[#FFFDF6] px-2.5 py-2 text-xs"
            >
              <div>
                <p className="font-semibold text-[#153E73]">
                  v{v.version_number}
                  {v.label ? ` · ${v.label}` : ""}
                </p>
                <p className="text-[#8A94A6]">
                  {v.status}
                  {v.updated_at
                    ? ` · ${new Date(v.updated_at).toLocaleString("zh-TW")}`
                    : ""}
                </p>
              </div>
              {onRestoreAsDraft ? (
                <button
                  type="button"
                  disabled={disabled}
                  className="shrink-0 rounded-lg border border-[#E7EAF0] px-2 py-1 font-medium text-[#153E73] hover:bg-white disabled:opacity-50"
                  onClick={() => onRestoreAsDraft(v.id)}
                >
                  還原為草稿
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-[#8A94A6]">
        還原＝建立新草稿，不直接覆寫正式站。
      </p>
    </div>
  );
}
