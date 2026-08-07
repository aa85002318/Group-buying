"use client";

import { ArrowRight, Eye, LayoutList, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";

export type CmsWorkflowStep = "list" | "edit" | "preview";

const STEPS: {
  id: CmsWorkflowStep;
  label: string;
  icon: typeof LayoutList;
}[] = [
  { id: "list", label: "區塊列表", icon: LayoutList },
  { id: "edit", label: "設定內容", icon: PencilLine },
  { id: "preview", label: "即時預覽", icon: Eye },
];

/** Shared CMS hub workflow indicator: 區塊列表 → 設定內容 → 即時預覽 */
export function CmsWorkflowSteps({
  active,
  className,
}: {
  active: CmsWorkflowStep;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-1.5 text-[12px]", className)}>
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === active;
        return (
          <li key={step.id} className="flex items-center gap-1.5">
            {index > 0 ? (
              <ArrowRight className="h-3 w-3 text-[#153E73]/30" aria-hidden />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
                isActive
                  ? "bg-[#FFE149] text-[#153E73]"
                  : "bg-[#F7F8FA] text-[#153E73]/55"
              )}
            >
              <Icon className="h-3 w-3" />
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
