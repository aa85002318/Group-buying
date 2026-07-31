"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Read-only panel: content comes from another admin module. */
export function ExternalSourcePanel({
  title,
  description,
  manageHref,
  manageLabel,
}: {
  title: string;
  description: string;
  manageHref?: string;
  manageLabel?: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-[#153E73]/25 bg-[#F5F8FC] p-3">
      <p className="text-sm font-semibold text-[#153E73]">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      {manageHref ? (
        <Link
          href={manageHref}
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "inline-flex gap-1.5")}
        >
          {manageLabel || "前往管理"}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
