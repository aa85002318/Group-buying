"use client";

import { cn } from "@/lib/utils";
import { CMS_SAVE_STATUS_LABEL, type CmsSaveStatus } from "./types";

export function CmsSaveStatusBadge({ status }: { status: CmsSaveStatus }) {
  const tone =
    status === "error"
      ? "bg-danger/10 text-danger"
      : status === "dirty" || status === "saving"
        ? "bg-amber-100 text-amber-900"
        : status === "published"
          ? "bg-success-soft text-success"
          : "bg-[#FFF5C7] text-[#153E73]";

  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", tone)}>
      {CMS_SAVE_STATUS_LABEL[status]}
    </span>
  );
}
