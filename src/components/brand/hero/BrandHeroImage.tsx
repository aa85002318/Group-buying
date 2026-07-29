import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandHeroImage({
  desktopUrl,
  mobileUrl,
  alt,
  className,
}: {
  desktopUrl?: string | null;
  mobileUrl?: string | null;
  alt: string;
  className?: string;
}) {
  const desktop = desktopUrl || mobileUrl;
  const mobile = mobileUrl || desktopUrl;

  if (!desktop && !mobile) {
    return (
      <div
        className={cn(
          "h-full w-full bg-gradient-to-br from-[var(--brand-primary-soft)] via-[var(--brand-accent)] to-[var(--brand-background-soft)]",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <picture className={cn("block h-full w-full", className)}>
      {mobile ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
      {desktop ? (
        <Image
          src={desktop}
          alt={alt}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1280px"
          unoptimized
        />
      ) : null}
    </picture>
  );
}
