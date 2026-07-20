import { cn } from "@/lib/utils";

type AppLoadingProps = {
  className?: string;
  rows?: number;
  label?: string;
};

/** Soft brand-token loading skeleton — no full-page spinner. */
export function AppLoading({ className, rows = 3, label = "載入中" }: AppLoadingProps) {
  return (
    <div
      className={cn("space-y-3 py-4", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="h-4 w-1/3 animate-pulse rounded-lg bg-primary/20" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-card bg-surface-soft"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
