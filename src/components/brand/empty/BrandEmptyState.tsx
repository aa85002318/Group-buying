import { BrandButton } from "@/components/brand/button/BrandButton";
import { cn } from "@/lib/utils";

export function BrandEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--brand-border)] bg-[var(--brand-surface-muted)] px-6 py-10 text-center",
        className
      )}
      role="status"
    >
      <p className="text-base font-bold text-[var(--brand-text-primary)]">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-[var(--brand-text-secondary)]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <BrandButton size="sm" onClick={onAction}>
          {actionLabel}
        </BrandButton>
      ) : null}
      {actionLabel && actionHref ? (
        <a href={actionHref}>
          <BrandButton size="sm">{actionLabel}</BrandButton>
        </a>
      ) : null}
    </div>
  );
}

export function BrandErrorState({
  title = "發生錯誤",
  description = "請稍後再試，或重新整理頁面。",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <BrandEmptyState
      className={className}
      title={title}
      description={description}
      actionLabel={onRetry ? "重新整理" : undefined}
      onAction={onRetry}
    />
  );
}
