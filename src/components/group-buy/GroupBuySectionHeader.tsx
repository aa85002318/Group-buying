import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GroupBuySectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  trailing,
  className,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  trailing?: ReactNode;
  className?: string;
}) {
  const action =
    actionLabel && actionHref ? (
      <Link
        href={actionHref}
        className="inline-flex h-11 items-center gap-0.5 text-sm font-semibold text-[#153E73]"
        aria-label={actionLabel}
      >
        {actionLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    ) : actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-11 items-center gap-0.5 text-sm font-semibold text-[#153E73]"
        aria-label={actionLabel}
      >
        {actionLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    ) : (
      trailing
    );

  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-black text-[#153E73] md:text-xl">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-[#687386]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
