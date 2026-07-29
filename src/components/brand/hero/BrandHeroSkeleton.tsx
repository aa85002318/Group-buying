import { cn } from "@/lib/utils";

export function BrandHeroSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("brand-page-pad", className)} aria-busy aria-label="載入中">
      <div
        className="w-full animate-pulse rounded-[var(--brand-hero-radius)] bg-[var(--brand-surface-muted)]"
        style={{ height: "var(--brand-hero-height-mobile)" }}
      />
      <div
        className="mx-auto -mt-[var(--brand-search-float)] h-[var(--brand-search-height)] w-full max-w-3xl animate-pulse rounded-[var(--brand-search-radius)] bg-[var(--brand-surface)] shadow-[var(--shadow-sm)]"
      />
    </div>
  );
}
