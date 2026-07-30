import Link from "next/link";

export function BrandHeroContent({
  title,
  subtitle,
  capsuleLabel,
  showTitle = true,
  showSubtitle = true,
  showCtas = false,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: {
  title: string;
  subtitle?: string | null;
  capsuleLabel?: string | null;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showCtas?: boolean;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
}) {
  const hasText = showTitle || showSubtitle || Boolean(capsuleLabel);
  const hasCtas =
    showCtas &&
    ((primaryCtaLabel && primaryCtaHref) || (secondaryCtaLabel && secondaryCtaHref));

  if (!hasText && !hasCtas) return null;

  return (
    <div
      className="absolute z-[4] flex flex-col"
      style={{
        top: "14%",
        left: "5%",
        width: "min(48%, 420px)",
        maxWidth: "52%",
      }}
    >
      {capsuleLabel ? (
        <span
          className="mb-3 inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-[#153E73] shadow-[0_4px_14px_rgba(21,62,115,0.08)] sm:text-[12px]"
        >
          {capsuleLabel}
        </span>
      ) : null}

      {showTitle && title ? (
        <h1
          className="m-0 font-bold leading-[1.2] text-[#153E73]"
          style={{ fontSize: "clamp(22px, 3.6vw, 42px)" }}
        >
          {title}
        </h1>
      ) : null}

      {showSubtitle && subtitle ? (
        <p
          className="mt-2 whitespace-pre-line font-medium leading-[1.55] text-[#153E73]/90"
          style={{ fontSize: "clamp(12px, 1.4vw, 16px)" }}
        >
          {subtitle}
        </p>
      ) : null}

      {hasCtas ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {primaryCtaLabel && primaryCtaHref ? (
            <Link
              href={primaryCtaHref}
              className="inline-flex h-[44px] items-center justify-center rounded-full bg-[#153E73] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(21,62,115,0.28)] transition hover:bg-[#1a4d8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153E73]/40 sm:h-[52px] sm:px-6 sm:text-[15px]"
            >
              {primaryCtaLabel}
              <span className="ml-1.5" aria-hidden>
                →
              </span>
            </Link>
          ) : null}
          {secondaryCtaLabel && secondaryCtaHref ? (
            <Link
              href={secondaryCtaHref}
              className="inline-flex h-[44px] items-center justify-center rounded-full border border-[#153E73] bg-white px-5 text-[14px] font-semibold text-[#153E73] transition hover:bg-[#EEF8FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153E73]/30 sm:h-[52px] sm:px-6 sm:text-[15px]"
            >
              {secondaryCtaLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
