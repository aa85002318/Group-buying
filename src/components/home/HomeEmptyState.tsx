import Link from "next/link";
import { Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
};

export function HomeEmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  actionHref,
  actionLabel,
  onAction,
  compact,
  className,
}: HomeEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-border-soft bg-surface-soft text-center",
        compact ? "px-4 py-5" : "px-5 py-8",
        className
      )}
    >
      <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-yellow text-brand-yellow">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-bold text-brand-caramel">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-foreground-secondary">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-3 inline-flex h-10 min-h-[44px] items-center justify-center rounded-button bg-brand-primary px-4 text-sm font-bold text-white transition duration-200 hover:bg-primary-hover"
        >
          {actionLabel}
        </Link>
      ) : null}
      {onAction && actionLabel && !actionHref ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex h-10 min-h-[44px] items-center justify-center rounded-button bg-brand-primary px-4 text-sm font-bold text-white transition duration-200 hover:bg-primary-hover"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
