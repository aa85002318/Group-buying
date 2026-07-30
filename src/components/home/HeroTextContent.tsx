/** Optional text overlay when CMS enables title/description (art often already includes copy). */
export function HeroTextContent({
  title,
  description,
  showTitle = false,
  showDescription = false,
}: {
  title?: string | null;
  description?: string | null;
  showTitle?: boolean;
  showDescription?: boolean;
}) {
  if (!showTitle && !showDescription) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col justify-start px-5 pt-10 md:justify-center md:px-[8%] md:pt-0 md:pb-24">
      <div className="max-w-[min(36rem,52%)]">
        {showTitle && title ? (
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-tight text-[#153E73]">
            {title}
          </h1>
        ) : null}
        {showDescription && description ? (
          <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-[#687386] md:text-[16px]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
