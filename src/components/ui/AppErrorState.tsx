import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type AppErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

/** Soft error panel with retry + support link. */
export function AppErrorState({
  title = "出了點小問題",
  description = "請稍後再試，或聯繫客服協助處理。",
  onRetry,
  className,
}: AppErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-card bg-error-soft px-6 py-10 text-center",
        className
      )}
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-error">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="max-w-xs text-sm leading-relaxed text-foreground-secondary">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            重新整理
          </Button>
        ) : null}
        <Link
          href={APP_ROUTES.support}
          className="inline-flex h-11 min-h-11 items-center justify-center rounded-button border border-border bg-transparent px-5 text-sm font-bold text-foreground transition hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          聯絡客服
        </Link>
      </div>
    </div>
  );
}
