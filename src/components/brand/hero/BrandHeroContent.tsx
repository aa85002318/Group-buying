import { cn } from "@/lib/utils";

export function BrandHeroContent({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("relative z-[1] max-w-xl space-y-2 text-[var(--brand-text-inverse)]", className)}>
      <h1
        className="font-bold leading-tight drop-shadow"
        style={{
          fontSize: "var(--font-size-h1-mobile)",
          fontFamily: "var(--font-brand)",
        }}
      >
        <span className="md:[font-size:var(--font-size-h1-desktop)]">{title}</span>
      </h1>
      {subtitle ? (
        <p className="text-sm font-medium text-white/90 drop-shadow md:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}
