export function BrandHeroContent({
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
}: {
  title: string;
  subtitle?: string | null;
  showTitle?: boolean;
  showSubtitle?: boolean;
}) {
  if (!showTitle && !showSubtitle) return null;

  return (
    <div
      className="absolute z-[2]"
      style={{
        top: "18%",
        left: "6%",
        width: "42%",
      }}
    >
      {showTitle && title ? (
        <h1
          className="m-0 font-bold leading-[1.25] text-[#43332b]"
          style={{
            fontSize: "clamp(20px, 3.2vw, 44px)",
          }}
        >
          {title}
        </h1>
      ) : null}
      {showSubtitle && subtitle ? (
        <p
          className="mt-[10px] hidden leading-[1.6] text-[#6d5c53] min-[375px]:block"
          style={{ fontSize: "clamp(12px, 1.35vw, 18px)" }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
