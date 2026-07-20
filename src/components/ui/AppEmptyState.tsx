import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";

type AppEmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/** Soft empty state with brand mark + optional CTA. */
export function AppEmptyState({
  title = "目前還沒有內容",
  description = "稍後再回來看看，或先逛逛其他好物。",
  actionLabel,
  onAction,
  className,
}: AppEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-card bg-surface-soft px-6 py-12 text-center",
        className
      )}
    >
      <ChimeidiyLogo variant="compact" href={null} className="opacity-80" />
      <div className="space-y-1.5">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="max-w-xs text-sm leading-relaxed text-foreground-secondary">
          {description}
        </p>
      </div>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
