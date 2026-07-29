import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrandSectionProps = {
  title?: string | null;
  subtitle?: string | null;
  moreHref?: string | null;
  moreLabel?: string;
  className?: string;
  children: React.ReactNode;
};

export function BrandSectionHeader({
  title,
  subtitle,
  moreHref,
  moreLabel = "查看更多",
}: Omit<BrandSectionProps, "children" | "className">) {
  if (!title && !subtitle && !moreHref) return null;
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {title ? (
          <h2
            className="font-bold text-[var(--brand-text-primary)]"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--brand-text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {moreHref ? (
        <Link
          href={moreHref}
          className="brand-focus-ring inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[var(--brand-primary)]"
        >
          {moreLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function BrandSection({
  title,
  subtitle,
  moreHref,
  moreLabel,
  className,
  children,
}: BrandSectionProps) {
  return (
    <section
      className={cn("w-full", className)}
      style={{ marginBottom: "var(--section-gap-mobile)" }}
      aria-label={title || undefined}
    >
      <BrandSectionHeader
        title={title}
        subtitle={subtitle}
        moreHref={moreHref}
        moreLabel={moreLabel}
      />
      {children}
    </section>
  );
}
